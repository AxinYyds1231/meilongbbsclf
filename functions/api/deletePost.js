// functions/api/deletePost.js
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
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
};

export async function onRequest(context) {
    const { request, env } = context;
    const db = createDb(env.USER_DATA);

    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
            status: 405,
            headers: CORS_HEADERS
        });
    }

    // 获取当前用户
    const cookieHeader = request.headers.get('Cookie') || '';
    const sessionMatch = cookieHeader.match(/session=([^;]+)/);
    const adminMatch = cookieHeader.match(/adminSession=([^;]+)/);

    let currentUser = null;
    let isAdmin = false;

    if (sessionMatch) {
        try {
            currentUser = JSON.parse(base64ToUtf8(sessionMatch[1]));
        } catch (e) {}
    }
    if (adminMatch) {
        try {
            const adminData = JSON.parse(base64ToUtf8(adminMatch[1]));
            if (adminData.isAdmin) isAdmin = true;
        } catch (e) {}
    }

    if (!currentUser && !isAdmin) {
        return new Response(JSON.stringify({ error: '请先登录' }), {
            status: 401,
            headers: CORS_HEADERS
        });
    }

    try {
        const formData = await request.formData();
        const postId = parseInt(formData.get('postId'));
        if (!postId) {
            return new Response(JSON.stringify({ error: '缺少帖子ID' }), {
                status: 400,
                headers: CORS_HEADERS
            });
        }

        const post = await db.getPostById(postId);
        if (!post) {
            return new Response(JSON.stringify({ error: '帖子不存在' }), {
                status: 404,
                headers: CORS_HEADERS
            });
        }

        // 权限检查
        if (!isAdmin && currentUser.uid !== post.authorUid) {
            return new Response(JSON.stringify({ error: '无权限删除此帖子' }), {
                status: 403,
                headers: CORS_HEADERS
            });
        }

        const success = await db.deletePost(postId);
        if (!success) {
            return new Response(JSON.stringify({ error: '删除失败' }), {
                status: 500,
                headers: CORS_HEADERS
            });
        }

        return new Response(JSON.stringify({ success: true, message: '已删除' }), {
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