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
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const categoryId = parseInt(url.searchParams.get('category')) || 0;

    const allPosts = await db.getPosts();
    let posts = allPosts.filter(p => !p.deleted);
    if (categoryId) {
        posts = posts.filter(p => p.categoryId === categoryId);
    }

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
            dislikesCount: p.dislikes.length
        };
    }));

    return new Response(JSON.stringify({ posts: result }), { status: 200, headers: CORS_HEADERS });
}