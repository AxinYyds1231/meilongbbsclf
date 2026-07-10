// functions/api/post.js
import { getPostById } from '../utils/db.js';

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

    const url = new URL(request.url);
    const id = parseInt(url.searchParams.get('id'));
    if (!id) {
        return new Response(JSON.stringify({ error: '缺少帖子ID' }), {
            status: 400,
            headers: CORS_HEADERS
        });
    }

    const post = await getPostById(id);  // 加 await
    if (!post) {
        return new Response(JSON.stringify({ error: '帖子不存在' }), {
            status: 404,
            headers: CORS_HEADERS
        });
    }

    return new Response(JSON.stringify({ post }), {
        status: 200,
        headers: CORS_HEADERS
    });
}