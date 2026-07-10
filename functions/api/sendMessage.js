// functions/api/sendMessage.js
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
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
            status: 405,
            headers: CORS_HEADERS
        });
    }

    const cookieHeader = request.headers.get('Cookie') || '';
    const sessionMatch = cookieHeader.match(/session=([^;]+)/);
    if (!sessionMatch) {
        return new Response(JSON.stringify({ error: '请先登录' }), {
            status: 401,
            headers: CORS_HEADERS
        });
    }

    try {
        const sessionData = JSON.parse(base64ToUtf8(sessionMatch[1]));
        const fromUid = sessionData.uid;
        const fromName = sessionData.name;

        const formData = await request.formData();
        const toUid = formData.get('toUid');
        const content = formData.get('content');

        if (!toUid || !content) {
            return new Response(JSON.stringify({ error: '收件人或内容不能为空' }), {
                status: 400,
                headers: CORS_HEADERS
            });
        }

        const target = await db.findUserByUid(toUid);
        if (!target) {
            return new Response(JSON.stringify({ error: '收件人不存在' }), {
                status: 404,
                headers: CORS_HEADERS
            });
        }

        const msg = await db.sendMessage(fromUid, toUid, content);
        // 通知收件人
        await db.addNotification(toUid, 'message', `您收到来自 ${fromName} 的私信`, `/inbox.html`);

        return new Response(JSON.stringify({ success: true, message: msg }), {
            status: 200,
            headers: CORS_HEADERS
        });
    } catch (error) {
        return new Response(JSON.stringify({
            error: '服务器错误',
            detail: error.message
        }), {
            status: 500,
            headers: CORS_HEADERS
        });
    }
}