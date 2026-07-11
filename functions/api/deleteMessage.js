// functions/api/deleteMessage.js
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

    const cookie = request.headers.get('Cookie') || '';
    const session = cookie.match(/session=([^;]+)/);
    if (!session) {
        return new Response(JSON.stringify({ error: '请先登录' }), { status: 401, headers: CORS_HEADERS });
    }
    const userData = JSON.parse(base64ToUtf8(session[1]));
    const uid = userData.uid;

    try {
        const formData = await request.formData();
        const msgId = parseInt(formData.get('msgId'));
        if (!msgId) {
            return new Response(JSON.stringify({ error: '缺少消息ID' }), { status: 400, headers: CORS_HEADERS });
        }

        const success = await db.deleteMessage(msgId, uid);
        if (!success) {
            return new Response(JSON.stringify({ error: '删除失败或无权删除' }), { status: 404, headers: CORS_HEADERS });
        }
        return new Response(JSON.stringify({ success: true }), { status: 200, headers: CORS_HEADERS });
    } catch (error) {
        return new Response(JSON.stringify({ error: '服务器错误', detail: error.message }), { status: 500, headers: CORS_HEADERS });
    }
}