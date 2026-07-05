// cloud-functions/api/login.js
import { getUsers } from '../utils/db.js';

// 跨域响应头
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
};

export async function onRequest(context) {
    const { request } = context;

    // 处理预检请求
    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
            status: 405,
            headers: CORS_HEADERS
        });
    }

    try {
        const formData = await request.formData();
        const uid = formData.get('uid');
        const password = formData.get('password');

        if (!uid || !password) {
            return new Response(JSON.stringify({ error: '请填写完整信息' }), {
                status: 400,
                headers: CORS_HEADERS
            });
        }

        const users = getUsers();
        const user = users.find(u => u.uid === uid && u.password === password);

        if (user) {
            const sessionData = JSON.stringify({ uid: user.uid, name: user.name });
            return new Response(JSON.stringify({ success: true, user: { uid: user.uid, name: user.name } }), {
                status: 200,
                headers: {
                    ...CORS_HEADERS,
                    'Set-Cookie': `session=${Buffer.from(sessionData).toString('base64')}; Path=/; HttpOnly; Max-Age=86400`
                }
            });
        } else {
            return new Response(JSON.stringify({ error: '账号或密码错误' }), {
                status: 401,
                headers: CORS_HEADERS
            });
        }
    } catch (error) {
        return new Response(JSON.stringify({ error: '服务器错误', detail: error.message }), {
            status: 500,
            headers: CORS_HEADERS
        });
    }
}