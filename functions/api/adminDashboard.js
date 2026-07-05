// functions/api/adminDashboard.js
import { getUsers } from '../utils/db.js';

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
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
};

export async function onRequest(context) {
    const { request } = context;

    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (request.method !== 'GET') {
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
            status: 405,
            headers: CORS_HEADERS
        });
    }

    const cookieHeader = request.headers.get('Cookie') || '';
    const sessionMatch = cookieHeader.match(/adminSession=([^;]+)/);

    if (!sessionMatch) {
        return new Response(JSON.stringify({ error: '未登录' }), {
            status: 401,
            headers: CORS_HEADERS
        });
    }

    try {
        const sessionData = JSON.parse(base64ToUtf8(sessionMatch[1]));
        if (!sessionData.isAdmin) {
            return new Response(JSON.stringify({ error: '无权限' }), {
                status: 403,
                headers: CORS_HEADERS
            });
        }

        const users = getUsers();
        // 返回所有字段，包括 grade, class
        const userList = users.map(u => ({
            uid: u.uid,
            name: u.name,
            gender: u.gender,
            password: u.password,   // 可选，为了演示保留
            grade: u.grade,
            class: u.class
        }));

        return new Response(JSON.stringify({ users: userList }), {
            status: 200,
            headers: CORS_HEADERS
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: '会话无效' }), {
            status: 401,
            headers: CORS_HEADERS
        });
    }
}