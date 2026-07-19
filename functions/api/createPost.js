// functions/api/createPost.js
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
        const title = formData.get('title');
        const content = formData.get('content');
        const categoryId = parseInt(formData.get('categoryId')) || 0;
        const attachmentsJson = formData.get('attachments');

        if (!title || !content) {
            return new Response(JSON.stringify({ error: '标题和内容不能为空' }), { status: 400, headers: CORS_HEADERS });
        }
        if (content.length > 1000) {
            return new Response(JSON.stringify({ error: '内容不能超过1000字' }), { status: 400, headers: CORS_HEADERS });
        }

        // 验证分类是否存在（支持多级分类）
        if (categoryId !== 0) {
            const cat = await db.getCategoryById(categoryId);
            if (!cat) {
                return new Response(JSON.stringify({ error: '分类不存在' }), { status: 400, headers: CORS_HEADERS });
            }
        }

        // 敏感词过滤
        const words = await db.getSensitiveWords();
        const filteredTitle = db.filterSensitive(title, words);
        const filteredContent = db.filterSensitive(content, words);

        let attachments = [];
        if (attachmentsJson) {
            try { attachments = JSON.parse(attachmentsJson); } catch (e) {}
        }

        const post = await db.createPost(filteredTitle, filteredContent, uid, name, attachments, categoryId);
        // 统计与积分
        await db.incrementStats('post');
        await db.addPoints(uid, 10);

        return new Response(JSON.stringify({ success: true, post }), { status: 200, headers: CORS_HEADERS });
    } catch (error) {
        return new Response(JSON.stringify({ error: '服务器错误', detail: error.message }), { status: 500, headers: CORS_HEADERS });
    }
}