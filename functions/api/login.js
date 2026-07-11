// functions/api/login.js
import { createDb } from '../utils/db.js';

function utf8ToBase64(str) {
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

// SHA-256 哈希函数（和 register 保持一致）
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
        const password = formData.get('password');

        if (!uid || !password) {
            return new Response(JSON.stringify({ error: '请填写完整信息' }), { status: 400, headers: CORS_HEADERS });
        }

        const user = await db.findUserByUid(uid);
        if (!user) {
            return new Response(JSON.stringify({ error: '账号或密码错误' }), { status: 401, headers: CORS_HEADERS });
        }

        // 哈希用户输入的密码，然后比对
        const hashedInput = await hashPassword(password);
        if (user.password !== hashedInput) {
            return new Response(JSON.stringify({ error: '账号或密码错误' }), { status: 401, headers: CORS_HEADERS });
        }

        const sessionData = JSON.stringify({ uid: user.uid, name: user.name });
        const encoded = utf8ToBase64(sessionData);
        const cookie = `session=${encoded}; Path=/; HttpOnly; Max-Age=86400; SameSite=Lax`;

        return new Response(JSON.stringify({ success: true, user: { uid: user.uid, name: user.name } }), {
            status: 200,
            headers: { ...CORS_HEADERS, 'Set-Cookie': cookie }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: '服务器错误', detail: error.message }), { status: 500, headers: CORS_HEADERS });
    }
}