// functions/api/adminLogin.js
import { createDb } from '../utils/db.js';

// SHA-256 哈希函数（与 register/login 保持一致）
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
        const password = formData.get('password');

        if (!password) {
            return new Response(JSON.stringify({ error: '请输入密码' }), { status: 400, headers: CORS_HEADERS });
        }

        // 获取存储的哈希
        const storedHash = await db.getAdminPasswordHash();
        if (!storedHash) {
            // 如果还没有设置过管理员密码，则使用默认密码并哈希存储（首次使用）
            const defaultPassword = 'meilongbbsadmin123';
            const defaultHash = await hashPassword(defaultPassword);
            await db.setAdminPasswordHash(defaultHash);
            // 用默认密码验证本次登录
            const inputHash = await hashPassword(password);
            if (inputHash !== defaultHash) {
                return new Response(JSON.stringify({ error: '密码错误' }), { status: 401, headers: CORS_HEADERS });
            }
        } else {
            const inputHash = await hashPassword(password);
            if (inputHash !== storedHash) {
                return new Response(JSON.stringify({ error: '密码错误' }), { status: 401, headers: CORS_HEADERS });
            }
        }

        // 登录成功，设置 session
        const sessionData = JSON.stringify({ isAdmin: true });
        const encoded = btoa(sessionData);
        const cookie = `adminSession=${encoded}; Path=/; HttpOnly; Max-Age=86400; SameSite=Lax`;

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { ...CORS_HEADERS, 'Set-Cookie': cookie }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: '服务器错误', detail: error.message }), { status: 500, headers: CORS_HEADERS });
    }
}