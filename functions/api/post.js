// functions/api/post.js
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
    const id = parseInt(url.searchParams.get('id'));
    if (!id) {
        return new Response(JSON.stringify({ error: '缺少帖子ID' }), { status: 400, headers: CORS_HEADERS });
    }

    const post = await db.getPostById(id);
    if (!post) {
        return new Response(JSON.stringify({ error: '帖子不存在' }), { status: 404, headers: CORS_HEADERS });
    }
    if (post.deleted) {
        return new Response(JSON.stringify({ error: '帖子已删除', deleteReason: post.deleteReason }), { status: 410, headers: CORS_HEADERS });
    }

    const author = await db.findUserByUid(post.authorUid);
    const cat = post.categoryId ? await db.getCategoryById(post.categoryId) : null;

    const result = {
        ...post,
        authorAvatar: author?.avatar || '',
        categoryName: cat?.name || '未分类',
        likesCount: post.likes.length,
        dislikesCount: post.dislikes.length,
        replies: post.replies.map(r => ({
            ...r,
            likesCount: r.likes.length,
            dislikesCount: r.dislikes.length
        }))
    };

    return new Response(JSON.stringify({ post: result }), { status: 200, headers: CORS_HEADERS });
}