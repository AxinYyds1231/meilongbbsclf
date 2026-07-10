// functions/api/posts.js
import { createDb } from '../utils/db.js';

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

    const allPosts = await db.getPosts();
    // 只返回审核通过的
    const approved = allPosts.filter(p => p.status === 'approved');
    const list = approved.map(p => ({
        id: p.id,
        title: p.title,
        authorName: p.authorName,
        createdAt: p.createdAt,
        replyCount: p.replies.length
    }));

    return new Response(JSON.stringify({ posts: list }), {
        status: 200,
        headers: CORS_HEADERS
    });
}