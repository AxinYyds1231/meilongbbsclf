// functions/api/reply.js
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
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: CORS_HEADERS });
    }

    const cookieHeader = request.headers.get('Cookie') || '';
    const sessionMatch = cookieHeader.match(/session=([^;]+)/);
    if (!sessionMatch) {
        return new Response(JSON.stringify({ error: '请先登录' }), { status: 401, headers: CORS_HEADERS });
    }

    try {
        const sessionData = JSON.parse(base64ToUtf8(sessionMatch[1]));
        const { uid, name } = sessionData;

        const formData = await request.formData();
        const postId = parseInt(formData.get('postId'));
        const content = formData.get('content');

        if (!postId || !content) {
            return new Response(JSON.stringify({ error: '参数不完整' }), { status: 400, headers: CORS_HEADERS });
        }
        if (content.length > 500) {
            return new Response(JSON.stringify({ error: '回复不能超过500字' }), { status: 400, headers: CORS_HEADERS });
        }

        const reply = await db.addReply(postId, content, uid, name);
        if (!reply) {
            return new Response(JSON.stringify({ error: '帖子不存在' }), { status: 404, headers: CORS_HEADERS });
        }
        // 回复加3分
        await db.addPoints(uid, 3);

        return new Response(JSON.stringify({ success: true, reply }), { status: 200, headers: CORS_HEADERS });
    } catch (error) {
        return new Response(JSON.stringify({ error: '服务器错误', detail: error.message }), { status: 500, headers: CORS_HEADERS });
    }
}