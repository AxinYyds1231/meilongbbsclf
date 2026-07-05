// functions/api/adminDeleteUser.js
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

    // 简单检查管理员身份
    const cookieHeader = request.headers.get('Cookie') || '';
    const sessionMatch = cookieHeader.match(/adminSession=([^;]+)/);
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

        // 暂未实现删除逻辑
        return new Response(JSON.stringify({
            error: '删除功能暂未开放'
        }), {
            status: 501,
            headers: CORS_HEADERS
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: '会话无效' }), {
            status: 401,
            headers: CORS_HEADERS
        });
    }
}