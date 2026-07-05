// functions/api/user.js
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
    const sessionMatch = cookieHeader.match(/session=([^;]+)/);

    if (!sessionMatch) {
        return new Response(JSON.stringify({ error: '未登录' }), {
            status: 401,
            headers: CORS_HEADERS
        });
    }

    try {
        // 使用 atob 解码
        const sessionData = JSON.parse(atob(sessionMatch[1]));
        return new Response(JSON.stringify({ user: sessionData }), {
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