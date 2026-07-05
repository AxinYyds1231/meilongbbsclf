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

    // 获取 Cookie 头
    const cookieHeader = request.headers.get('Cookie') || '';
    console.log('Cookie 原始值:', cookieHeader); // 调试日志

    // 尝试从 Cookie 中提取 session
    const sessionMatch = cookieHeader.match(/session=([^;]+)/);

    if (!sessionMatch) {
        return new Response(JSON.stringify({
            error: '未登录',
            cookie_received: cookieHeader || '(无)'
        }), {
            status: 401,
            headers: CORS_HEADERS
        });
    }

    try {
        // 解码 session
        const sessionData = JSON.parse(Buffer.from(sessionMatch[1], 'base64').toString());
        return new Response(JSON.stringify({
            user: sessionData
        }), {
            status: 200,
            headers: CORS_HEADERS
        });
    } catch (error) {
        return new Response(JSON.stringify({
            error: '会话无效',
            detail: error.message
        }), {
            status: 401,
            headers: CORS_HEADERS
        });
    }
}