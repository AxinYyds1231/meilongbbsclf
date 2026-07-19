// functions/api/deleteNotification.js
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
        const notifId = parseInt(formData.get('id'));
        if (!notifId) {
            return new Response(JSON.stringify({ error: '缺少通知ID' }), { status: 400, headers: CORS_HEADERS });
        }

        // 直接删除通知（不检查权限，因为通知本身就是用户自己的）
        // 但为了安全，可以验证该通知是否属于该用户
        const notifs = await db.getNotifications();
        const notif = notifs.find(n => n.id === notifId);
        if (!notif || notif.uid !== uid) {
            return new Response(JSON.stringify({ error: '无权删除' }), { status: 403, headers: CORS_HEADERS });
        }

        const success = await db.markNotificationRead(notifId); // 先标记已读，然后从列表移除
        // 但我们需要真正删除，而不是标记已读，所以需要 db 提供 deleteNotification 方法。
        // 我们直接在 db.js 添加 deleteNotification 方法，但为了快速，我们直接操作：
        // 由于 db.js 没有删除通知的方法，我们这里直接读取、过滤、保存。
        const updatedNotifs = notifs.filter(n => n.id !== notifId);
        await db.saveNotifications(updatedNotifs);

        return new Response(JSON.stringify({ success: true }), { status: 200, headers: CORS_HEADERS });
    } catch (error) {
        return new Response(JSON.stringify({ error: '服务器错误', detail: error.message }), { status: 500, headers: CORS_HEADERS });
    }
}