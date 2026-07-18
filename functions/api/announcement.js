// functions/api/announcement.js
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
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
};

export async function onRequest(context) {
    const { request, env } = context;
    const db = createDb(env.USER_DATA);

    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // GET 公开（获取有效公告）
    if (request.method === 'GET') {
        try {
            const anns = await db.getActiveAnnouncements();
            return new Response(JSON.stringify({ announcements: anns }), { status: 200, headers: CORS_HEADERS });
        } catch (error) {
            return new Response(JSON.stringify({ error: '服务器错误', detail: error.message }), { status: 500, headers: CORS_HEADERS });
        }
    }

    // POST/PUT/DELETE 需要管理员
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

    if (request.method === 'POST') {
        try {
            const formData = await request.formData();
            const title = formData.get('title');
            const content = formData.get('content');
            const isPinned = formData.get('isPinned') === 'true';
            const expiresAt = parseInt(formData.get('expiresAt')) || null;
            if (!title || !content) {
                return new Response(JSON.stringify({ error: '标题和内容不能为空' }), { status: 400, headers: CORS_HEADERS });
            }
            const ann = await db.addAnnouncement(title, content, isPinned, expiresAt);
            return new Response(JSON.stringify({ success: true, announcement: ann }), { status: 200, headers: CORS_HEADERS });
        } catch (error) {
            return new Response(JSON.stringify({ error: '服务器错误', detail: error.message }), { status: 500, headers: CORS_HEADERS });
        }
    }

    if (request.method === 'PUT') {
        try {
            const formData = await request.formData();
            const id = parseInt(formData.get('id'));
            const title = formData.get('title');
            const content = formData.get('content');
            const isPinned = formData.get('isPinned') === 'true';
            const expiresAt = parseInt(formData.get('expiresAt')) || null;
            if (!id || !title || !content) {
                return new Response(JSON.stringify({ error: '参数不完整' }), { status: 400, headers: CORS_HEADERS });
            }
            const updated = await db.updateAnnouncement(id, title, content, isPinned, expiresAt);
            if (!updated) {
                return new Response(JSON.stringify({ error: '公告不存在' }), { status: 404, headers: CORS_HEADERS });
            }
            return new Response(JSON.stringify({ success: true, announcement: updated }), { status: 200, headers: CORS_HEADERS });
        } catch (error) {
            return new Response(JSON.stringify({ error: '服务器错误', detail: error.message }), { status: 500, headers: CORS_HEADERS });
        }
    }

    if (request.method === 'DELETE') {
        try {
            const url = new URL(request.url);
            const id = parseInt(url.searchParams.get('id'));
            if (!id) {
                return new Response(JSON.stringify({ error: '缺少公告ID' }), { status: 400, headers: CORS_HEADERS });
            }
            const success = await db.deleteAnnouncement(id);
            return new Response(JSON.stringify({ success }), { status: 200, headers: CORS_HEADERS });
        } catch (error) {
            return new Response(JSON.stringify({ error: '服务器错误', detail: error.message }), { status: 500, headers: CORS_HEADERS });
        }
    }

    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: CORS_HEADERS });
}