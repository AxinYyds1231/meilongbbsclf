// functions/api/adminChangePassword.js
import { createDb } from '../utils/db.js';

async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
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

    // 验证管理员身份
    const cookieHeader = request.headers.get('Cookie') || '';
    const adminMatch = cookieHeader.match(/adminSession=([^;]+)/);
    if (!adminMatch) {
        return new Response(JSON.stringify({ error: '未登录' }), { status: 401, headers: CORS_HEADERS });
    }
    try {
        const sessionData = JSON.parse(atob(adminMatch[1]));
        if (!sessionData.isAdmin) {
            return new Response(JSON.stringify({ error: '无权限' }), { status: 403, headers: CORS_HEADERS });
        }
    } catch (e) {
        return new Response(JSON.stringify({ error: '会话无效' }), { status: 401, headers: CORS_HEADERS });
    }

    try {
        const formData = await request.formData();
        const oldPassword = formData.get('oldPassword');
        const newPassword = formData.get('newPassword');
        const confirmPassword = formData.get('confirmPassword');

        if (!oldPassword || !newPassword || !confirmPassword) {
            return new Response(JSON.stringify({ error: '请填写完整' }), { status: 400, headers: CORS_HEADERS });
        }
        if (newPassword !== confirmPassword) {
            return new Response(JSON.stringify({ error: '两次新密码不一致' }), { status: 400, headers: CORS_HEADERS });
        }
        if (newPassword.length < 8) {
            return new Response(JSON.stringify({ error: '新密码至少8位' }), { status: 400, headers: CORS_HEADERS });
        }

        // 验证旧密码
        const storedHash = await db.getAdminPasswordHash();
        if (!storedHash) {
            return new Response(JSON.stringify({ error: '未设置管理员密码，请通过重置功能' }), { status: 400, headers: CORS_HEADERS });
        }
        const oldHash = await hashPassword(oldPassword);
        if (oldHash !== storedHash) {
            return new Response(JSON.stringify({ error: '旧密码错误' }), { status: 401, headers: CORS_HEADERS });
        }

        // 更新密码
        const newHash = await hashPassword(newPassword);
        await db.setAdminPasswordHash(newHash);

        return new Response(JSON.stringify({ success: true, message: '密码已更新' }), { status: 200, headers: CORS_HEADERS });
    } catch (error) {
        return new Response(JSON.stringify({ error: '服务器错误', detail: error.message }), { status: 500, headers: CORS_HEADERS });
    }
}