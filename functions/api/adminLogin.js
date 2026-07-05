// functions/api/adminLogin.js
const ADMIN_PASSWORD = 'meilongbbsadmin123';

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

    // 只接受 POST
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
            status: 405,
            headers: CORS_HEADERS
        });
    }

    try {
        const formData = await request.formData();
        const password = formData.get('password');

        // 检查密码
        if (password === ADMIN_PASSWORD) {
            const sessionData = JSON.stringify({ isAdmin: true });
            return new Response(JSON.stringify({ success: true }), {
                status: 200,
                headers: {
                    ...CORS_HEADERS,
                    'Set-Cookie': `adminSession=${Buffer.from(sessionData).toString('base64')}; Path=/; HttpOnly; Max-Age=86400`
                }
            });
        } else {
            return new Response(JSON.stringify({ error: '管理员密码错误' }), {
                status: 401,
                headers: CORS_HEADERS
            });
        }
    } catch (error) {
        // 返回详细错误信息
        return new Response(JSON.stringify({
            error: '服务器错误',
            detail: error.message,
            stack: error.stack
        }), {
            status: 500,
            headers: CORS_HEADERS
        });
    }
}