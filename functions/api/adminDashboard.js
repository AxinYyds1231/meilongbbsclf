// cloud-functions/api/adminDashboard.js
import { getUsers } from '../utils/db.js';

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

    const cookie = request.headers.get('Cookie') || '';
    const sessionMatch = cookie.match(/adminSession=([^;]+)/);

    if (!sessionMatch) {
        return new Response(JSON.stringify({ error: '未登录' }), {
            status: 401,
            headers: CORS_HEADERS
        });
    }

    try {
        const sessionData = JSON.parse(Buffer.from(sessionMatch[1], 'base64').toString());
        if (!sessionData.isAdmin) {
            return new Response(JSON.stringify({ error: '无权限' }), {
                status: 403,
                headers: CORS_HEADERS
            });
        }

        const users = getUsers();
        // 返回所有字段，包括密码（明文，注意安全）
        const userList = users.map(u => ({
            uid: u.uid,
            name: u.name,
            gender: u.gender,
            password: u.password   // ← 明文密码（仅演示）
        }));
        return new Response(JSON.stringify({ users: userList }), {
            status: 200,
            headers: CORS_HEADERS
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: '会话无效', detail: error.message }), {
            status: 401,
            headers: CORS_HEADERS
        });
    }
}