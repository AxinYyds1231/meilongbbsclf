// functions/api/favorites.js
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
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: CORS_HEADERS });
    }

    const cookie = request.headers.get('Cookie') || '';
    const session = cookie.match(/session=([^;]+)/);
    if (!session) {
        return new Response(JSON.stringify({ error: '请先登录' }), { status: 401, headers: CORS_HEADERS });
    }
    const userData = JSON.parse(base64ToUtf8(session[1]));
    const uid = userData.uid;

    try {
        const favIds = await db.getFavorites(uid);
        // 获取帖子详情
        const allPosts = await db.getPosts();
        const posts = allPosts.filter(p => favIds.includes(p.id) && !p.deleted);
        const result = posts.map(p => ({
            id: p.id,
            title: p.title,
            authorName: p.authorName,
            createdAt: p.createdAt,
            replyCount: p.replies.length
        }));
        return new Response(JSON.stringify({ favorites: result }), { status: 200, headers: CORS_HEADERS });
    } catch (error) {
        return new Response(JSON.stringify({ error: '服务器错误', detail: error.message }), { status: 500, headers: CORS_HEADERS });
    }
}