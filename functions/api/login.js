// functions/api/login.js
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
};

export async function onRequest(context) {
    const { request } = context;

    // 只允许 POST
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
            status: 405,
            headers: CORS_HEADERS
        });
    }

    try {
        // 解析 formData
        const formData = await request.formData();
        const uid = formData.get('uid');
        const password = formData.get('password');

        return new Response(JSON.stringify({
            success: true,
            received: { uid, password }
        }), {
            status: 200,
            headers: CORS_HEADERS
        });
    } catch (error) {
        return new Response(JSON.stringify({
            error: '解析请求失败',
            detail: error.message
        }), {
            status: 500,
            headers: CORS_HEADERS
        });
    }
}