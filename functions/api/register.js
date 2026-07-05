// functions/api/register.js
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

    // 暂时返回未开放
    return new Response(JSON.stringify({
        error: '注册功能暂未开放，请使用测试账号 ml20300101 / Test123456'
    }), {
        status: 403,
        headers: CORS_HEADERS
    });
}