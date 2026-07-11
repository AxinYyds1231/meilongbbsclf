// functions/api/resetPassword.js
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

    try {
        const formData = await request.formData();
        const uid = formData.get('uid');
        const newPassword = formData.get('newPassword');
        const confirmPassword = formData.get('confirmPassword');

        if (!uid || !newPassword || !confirmPassword) {
            return new Response(JSON.stringify({ error: '请填写完整信息' }), { status: 400, headers: CORS_HEADERS });
        }
        if (newPassword !== confirmPassword) {
            return new Response(JSON.stringify({ error: '两次密码输入不一致' }), { status: 400, headers: CORS_HEADERS });
        }
        if (newPassword.length < 8) {
            return new Response(JSON.stringify({ error: '密码至少8位' }), { status: 400, headers: CORS_HEADERS });
        }

        const user = await db.findUserByUid(uid);
        if (!user) {
            return new Response(JSON.stringify({ error: 'UID不存在' }), { status: 404, headers: CORS_HEADERS });
        }

        // 重置密码（哈希）
        const hashed = await hashPassword(newPassword);
        await db.updateUser(uid, { password: hashed });

        return new Response(JSON.stringify({ success: true, message: '密码已重置，请重新登录' }), {
            status: 200,
            headers: CORS_HEADERS
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: '服务器错误', detail: error.message }), { status: 500, headers: CORS_HEADERS });
    }
}