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

    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (request.method === 'GET') {
        // 获取树形回复
        const url = new URL(request.url);
        const postId = parseInt(url.searchParams.get('postId'));
        if (!postId) {
            return new Response(JSON.stringify({ error: '缺少帖子ID' }), { status: 400, headers: CORS_HEADERS });
        }
        try {
            const tree = await db.getTreeReplies(postId);
            return new Response(JSON.stringify({ tree }), { status: 200, headers: CORS_HEADERS });
        } catch (error) {
            return new Response(JSON.stringify({ error: '服务器错误', detail: error.message }), { status: 500, headers: CORS_HEADERS });
        }
    }

    if (request.method === 'POST') {
        // 新增回复
        const cookie = request.headers.get('Cookie') || '';
        const session = cookie.match(/session=([^;]+)/);
        if (!session) {
            return new Response(JSON.stringify({ error: '请先登录' }), { status: 401, headers: CORS_HEADERS });
        }
        const userData = JSON.parse(base64ToUtf8(session[1]));
        const uid = userData.uid;
        const name = userData.name;

        try {
            const formData = await request.formData();
            const postId = parseInt(formData.get('postId'));
            const parentId = parseInt(formData.get('parentId')) || 0;
            const content = formData.get('content');
            if (!postId || !content) {
                return new Response(JSON.stringify({ error: '参数不完整' }), { status: 400, headers: CORS_HEADERS });
            }

            // 敏感词过滤
            const words = await db.getSensitiveWords();
            const filtered = db.filterSensitive(content, words);

            const reply = await db.addTreeReply(postId, parentId, filtered, uid, name);
            if (!reply) {
                return new Response(JSON.stringify({ error: '帖子不存在' }), { status: 404, headers: CORS_HEADERS });
            }

            // 统计回复数
            await db.incrementStats('reply');

            return new Response(JSON.stringify({ success: true, reply }), { status: 200, headers: CORS_HEADERS });
        } catch (error) {
            return new Response(JSON.stringify({ error: '服务器错误', detail: error.message }), { status: 500, headers: CORS_HEADERS });
        }
    }

    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: CORS_HEADERS });
}