// functions/api/adminGetPendingPosts.js
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
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
};

export async function onRequest(context) {
    const { request, env } = context;
    const db = createDb(env.USER_DATA);

    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (request.method !== 'GET') {
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
            status: 405,
            headers: CORS_HEADERS
        });
    }

    const cookieHeader = request.headers.get('Cookie') || '';
    const adminMatch = cookieHeader.match(/adminSession=([^;]+)/);
    if (!adminMatch) {
        return new Response(JSON.stringify({ error: '未登录' }), {
            status: 401,
            headers: CORS_HEADERS
        });
    }

    try {
        const adminData = JSON.parse(base64ToUtf8(adminMatch[1]));
        if (!adminData.isAdmin) {
            return new Response(JSON.stringify({ error: '无权限' }), {
                status: 403,
                headers: CORS_HEADERS
            });
        }

        const pendingPosts = await db.getPendingPosts();
        const list = pendingPosts.map(p => ({
            id: p.id,
            title: p.title,
            authorName: p.authorName,
            content: p.content.substring(0, 100) + (p.content.length > 100 ? '...' : ''),
            createdAt: p.createdAt,
            attachments: p.attachments || []  // 包含完整附件信息
        }));

        return new Response(JSON.stringify({ posts: list }), {
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