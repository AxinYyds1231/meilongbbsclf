// functions/api/like.js
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
        const uid = sessionData.uid;

        const formData = await request.formData();
        const target = formData.get('target'); // 'post' 或 'reply'
        const postId = parseInt(formData.get('postId'));
        const replyIndex = target === 'reply' ? parseInt(formData.get('replyIndex')) : null;
        const type = formData.get('type'); // 'like' 或 'dislike'

        if (!postId || !type || !['like','dislike'].includes(type)) {
            return new Response(JSON.stringify({ error: '参数错误' }), { status: 400, headers: CORS_HEADERS });
        }

        let result;
        if (target === 'reply' && replyIndex !== null) {
            result = await db.toggleReplyLike(postId, replyIndex, uid, type);
            if (!result) return new Response(JSON.stringify({ error: '回复不存在' }), { status: 404, headers: CORS_HEADERS });
        } else {
            result = await db.toggleLike(postId, uid, type);
            if (!result) return new Response(JSON.stringify({ error: '帖子不存在' }), { status: 404, headers: CORS_HEADERS });
        }

        const post = await db.getPostById(postId);
        const likes = post.likes.length;
        const dislikes = post.dislikes.length;
        let replyLikes = 0, replyDislikes = 0;
        if (target === 'reply' && replyIndex !== null && post.replies[replyIndex]) {
            replyLikes = post.replies[replyIndex].likes.length;
            replyDislikes = post.replies[replyIndex].dislikes.length;
        }

        return new Response(JSON.stringify({
            success: true,
            likes,
            dislikes,
            replyLikes,
            replyDislikes
        }), { status: 200, headers: CORS_HEADERS });
    } catch (error) {
        return new Response(JSON.stringify({ error: '服务器错误', detail: error.message }), { status: 500, headers: CORS_HEADERS });
    }
}