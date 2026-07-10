// functions/api/posts.js
import { getPosts } from '../utils/db.js';

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
};

export async function onRequest(context) {
    const { request } = context;

    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (request.method !== 'GET') {
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
            status: 405,
            headers: CORS_HEADERS
        });
    }

    const posts = getPosts();
    // 返回列表（不包含回复内容，只含回复数）
    const list = posts.map(p => ({
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