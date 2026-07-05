// cloud-functions/api/adminDeleteUser.js
import { getUsers, saveUsers } from '../utils/db.js';

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
};

export async function onRequest(context) {
    const { request } = context;

    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
            status: 405,
            headers: CORS_HEADERS
        });
    }

    // 检查管理员登录状态
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

        // 获取要删除的 UID
        const formData = await request.formData();
        const uid = formData.get('uid');
        if (!uid) {
            return new Response(JSON.stringify({ error: '缺少 UID 参数' }), {
                status: 400,
                headers: CORS_HEADERS
            });
        }

        // 读取用户列表，过滤掉该 UID
        let users = getUsers();
        const existed = users.find(u => u.uid === uid);
        if (!existed) {
            return new Response(JSON.stringify({ error: '用户不存在' }), {
                status: 404,
                headers: CORS_HEADERS
            });
        }

        users = users.filter(u => u.uid !== uid);
        saveUsers(users);

        return new Response(JSON.stringify({ success: true, message: '用户已删除' }), {
            status: 200,
            headers: CORS_HEADERS
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: '服务器错误', detail: error.message }), {
            status: 500,
            headers: CORS_HEADERS
        });
    }
}