// functions/api/updateProfile.js
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
        let bio = formData.get('bio');

        if (bio === null) {
            return new Response(JSON.stringify({ error: '缺少简介内容' }), { status: 400, headers: CORS_HEADERS });
        }

        // 字数限制（200字）
        if (bio.length > 200) {
            return new Response(JSON.stringify({ error: '个人简介不能超过200字' }), { status: 400, headers: CORS_HEADERS });
        }

        // 敏感词过滤
        const words = await db.getSensitiveWords();
        bio = db.filterSensitive(bio, words);

        const updated = await db.updateUser(uid, { bio });
        if (!updated) {
            return new Response(JSON.stringify({ error: '用户不存在' }), { status: 404, headers: CORS_HEADERS });
        }
        return new Response(JSON.stringify({ success: true, bio: updated.bio }), { status: 200, headers: CORS_HEADERS });
    } catch (error) {
        return new Response(JSON.stringify({ error: '服务器错误', detail: error.message }), { status: 500, headers: CORS_HEADERS });
    }
}