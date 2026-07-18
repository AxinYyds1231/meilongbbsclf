// functions/api/replyTree.js
import { createDb } from '../utils/db.js';

function base64ToUtf8(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
}

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
};

export async function onRequest(context) {
    const { request, env } = context;
    const db = createDb(env.USER_DATA);

    // 处理 OPTIONS 预检请求
    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // ---- GET：获取树形回复 ----
    if (request.method === 'GET') {
        const url = new URL(request.url);
        const postId = parseInt(url.searchParams.get('postId'));
        if (!postId) {
            return new Response(JSON.stringify({ error: '缺少帖子ID' }), { 
                status: 400, 
                headers: CORS_HEADERS 
            });
        }

        try {
            const tree = await db.getTreeReplies(postId);
            return new Response(JSON.stringify({ tree }), { 
                status: 200, 
                headers: CORS_HEADERS 
            });
        } catch (error) {
            return new Response(JSON.stringify({ 
                error: '服务器错误', 
                detail: error.message 
            }), { 
                status: 500, 
                headers: CORS_HEADERS 
            });
        }
    }

    // ---- POST：新增回复 ----
    if (request.method === 'POST') {
        // 验证登录
        const cookie = request.headers.get('Cookie') || '';
        const session = cookie.match(/session=([^;]+)/);
        if (!session) {
            return new Response(JSON.stringify({ error: '请先登录' }), { 
                status: 401, 
                headers: CORS_HEADERS 
            });
        }

        let userData;
        try {
            userData = JSON.parse(base64ToUtf8(session[1]));
        } catch (e) {
            return new Response(JSON.stringify({ error: '会话无效' }), { 
                status: 401, 
                headers: CORS_HEADERS 
            });
        }

        const uid = userData.uid;
        const name = userData.name;

        try {
            const formData = await request.formData();
            const postId = parseInt(formData.get('postId'));
            const parentId = parseInt(formData.get('parentId')) || 0; // 父回复ID，0表示顶级回复
            let content = formData.get('content');

            if (!postId || !content) {
                return new Response(JSON.stringify({ error: '参数不完整' }), { 
                    status: 400, 
                    headers: CORS_HEADERS 
                });
            }

            // 内容长度限制
            if (content.length > 500) {
                return new Response(JSON.stringify({ error: '回复内容不能超过500字' }), { 
                    status: 400, 
                    headers: CORS_HEADERS 
                });
            }

            // 敏感词过滤
            const words = await db.getSensitiveWords();
            const filtered = db.filterSensitive(content, words);

            // 添加树形回复
            const reply = await db.addTreeReply(postId, parentId, filtered, uid, name);
            if (!reply) {
                return new Response(JSON.stringify({ error: '帖子不存在' }), { 
                    status: 404, 
                    headers: CORS_HEADERS 
                });
            }

            // 统计回复数
            await db.incrementStats('reply');

            // 增加积分（回复+3分）
            await db.addPoints(uid, 3);

            // 通知被回复的用户（如果parentId > 0，说明是回复某条回复）
            if (parentId > 0) {
                // 获取父回复的作者
                const post = await db.getPostById(postId);
                if (post) {
                    const parentReply = post.replies.find(r => r.id === parentId);
                    if (parentReply && parentReply.uid !== uid) {
                        await db.addNotification(
                            parentReply.uid,
                            'reply',
                            `${name} 回复了你的评论：${filtered.substring(0, 30)}${filtered.length > 30 ? '...' : ''}`,
                            `/post.html?id=${postId}`
                        );
                    }
                }
            } else {
                // 回复帖子本身，通知楼主
                const post = await db.getPostById(postId);
                if (post && post.authorUid !== uid) {
                    await db.addNotification(
                        post.authorUid,
                        'reply',
                        `${name} 回复了你的帖子《${post.title}》：${filtered.substring(0, 30)}${filtered.length > 30 ? '...' : ''}`,
                        `/post.html?id=${postId}`
                    );
                }
            }

            return new Response(JSON.stringify({ 
                success: true, 
                reply,
                message: '回复成功' 
            }), { 
                status: 200, 
                headers: CORS_HEADERS 
            });

        } catch (error) {
            return new Response(JSON.stringify({ 
                error: '服务器错误', 
                detail: error.message 
            }), { 
                status: 500, 
                headers: CORS_HEADERS 
            });
        }
    }

    // 其他方法不允许
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { 
        status: 405, 
        headers: CORS_HEADERS 
    });
}