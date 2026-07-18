// functions/api/sensitive.js
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
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
};

export async function onRequest(context) {
    const { request, env } = context;
    const db = createDb(env.USER_DATA);

    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // 验证管理员
    const cookie = request.headers.get('Cookie') || '';
    const adminMatch = cookie.match(/adminSession=([^;]+)/);
    if (!adminMatch) {
        return new Response(JSON.stringify({ error: '未登录' }), { status: 401, headers: CORS_HEADERS });
    }
    let isAdmin = false;
    try {
        const adminData = JSON.parse(base64ToUtf8(adminMatch[1]));
        if (adminData.isAdmin) isAdmin = true;
    } catch (e) {}
    if (!isAdmin) {
        return new Response(JSON.stringify({ error: '无权限' }), { status: 403, headers: CORS_HEADERS });
    }

    if (request.method === 'GET') {
        const words = await db.getSensitiveWords();
        return new Response(JSON.stringify({ words }), { status: 200, headers: CORS_HEADERS });
    }

    if (request.method === 'POST') {
        try {
            const formData = await request.formData();
            const word = formData.get('word');
            if (!word) {
                return new Response(JSON.stringify({ error: '缺少敏感词' }), { status: 400, headers: CORS_HEADERS });
            }
            const success = await db.addSensitiveWord(word.trim());
            return new Response(JSON.stringify({ success }), { status: 200, headers: CORS_HEADERS });
        } catch (error) {
            return new Response(JSON.stringify({ error: '服务器错误', detail: error.message }), { status: 500, headers: CORS_HEADERS });
        }
    }

    if (request.method === 'DELETE') {
        try {
            const url = new URL(request.url);
            const word = url.searchParams.get('word');
            if (!word) {
                return new Response(JSON.stringify({ error: '缺少敏感词' }), { status: 400, headers: CORS_HEADERS });
            }
            const success = await db.removeSensitiveWord(word);
            return new Response(JSON.stringify({ success }), { status: 200, headers: CORS_HEADERS });
        } catch (error) {
            return new Response(JSON.stringify({ error: '服务器错误', detail: error.message }), { status: 500, headers: CORS_HEADERS });
        }
    }

    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: CORS_HEADERS });
}