// functions/api/adminSendMessage.js
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
    const adminMatch = cookieHeader.match(/adminSession=([^;]+)/);
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

    try {
        const formData = await request.formData();
        const toUid = formData.get('toUid');
        let content = formData.get('content');
        if (!toUid || !content) {
            return new Response(JSON.stringify({ error: '收件人或内容不能为空' }), { status: 400, headers: CORS_HEADERS });
        }
        if (content.length > 500) {
            return new Response(JSON.stringify({ error: '消息内容不能超过500字' }), { status: 400, headers: CORS_HEADERS });
        }

        // 敏感词过滤
        const words = await db.getSensitiveWords();
        content = db.filterSensitive(content, words);

        // 检查收件人是否存在（但 admin 也可以给 admin 发？不需要）
        if (toUid !== 'admin') {
            const target = await db.findUserByUid(toUid);
            if (!target) {
                return new Response(JSON.stringify({ error: '收件人不存在' }), { status: 404, headers: CORS_HEADERS });
            }
        }

        // 发件人为 'admin'
        const msg = await db.sendMessage('admin', toUid, content, 'user');
        return new Response(JSON.stringify({ success: true, message: msg }), {
            status: 200,
            headers: CORS_HEADERS
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: '服务器错误', detail: error.message }), { status: 500, headers: CORS_HEADERS });
    }
}