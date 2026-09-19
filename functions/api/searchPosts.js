// functions/api/searchPosts.js
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
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const keyword = url.searchParams.get('q') || '';
    if (!keyword.trim()) {
        return new Response(JSON.stringify({ posts: [] }), { status: 200, headers: CORS_HEADERS });
    }

    try {
        const posts = await db.searchPosts(keyword.trim());
        const result = await Promise.all(posts.map(async p => {
            const author = await db.findUserByUid(p.authorUid);
            const cat = p.categoryId ? await db.getCategoryById(p.categoryId) : null;
            return {
                id: p.id,
                title: p.title,
                authorName: p.authorName,
                authorUid: p.authorUid,
                authorAvatar: author?.avatar || '',
                categoryName: cat?.name || '未分类',
                createdAt: p.createdAt,
                replyCount: p.replies.length,
                likesCount: p.likes.length,
                dislikesCount: p.dislikes.length,
                views: p.views || 0
            };
        }));
        return new Response(JSON.stringify({ posts: result }), { status: 200, headers: CORS_HEADERS });
    } catch (error) {
        return new Response(JSON.stringify({ error: '服务器错误', detail: error.message }), { status: 500, headers: CORS_HEADERS });
    }
}