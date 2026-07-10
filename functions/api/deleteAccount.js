// functions/api/deleteAccount.js
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
        const { uid } = sessionData;

        // 确认密码
        const formData = await request.formData();
        const password = formData.get('password');
        if (!password) {
            return new Response(JSON.stringify({ error: '请输入密码确认' }), {
                status: 400,
                headers: CORS_HEADERS
            });
        }

        const user = await db.findUserByUid(uid);
        if (!user || user.password !== password) {
            return new Response(JSON.stringify({ error: '密码错误' }), {
                status: 401,
                headers: CORS_HEADERS
            });
        }

        // 删除用户
        await db.deleteUser(uid);

        // 清除 session cookie
        const clearCookie = 'session=; Path=/; Max-Age=0';

        return new Response(JSON.stringify({ success: true, message: '账号已注销' }), {
            status: 200,
            headers: {
                ...CORS_HEADERS,
                'Set-Cookie': clearCookie
            }
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