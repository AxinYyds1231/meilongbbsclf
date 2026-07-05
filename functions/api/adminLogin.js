// cloud-functions/api/adminLogin.js
const ADMIN_PASSWORD = 'meilongbbsadmin123';

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

    try {
        const formData = await request.formData();
        const password = formData.get('password');

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
        return new Response(JSON.stringify({ error: '服务器错误', detail: error.message }), {
            status: 500,
            headers: CORS_HEADERS
        });
    }
}