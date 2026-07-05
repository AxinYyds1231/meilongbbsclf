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

    // 处理 OPTIONS 预检请求
    if (request.method === 'OPTIONS') {
        return new Response(null, { 
            status: 204, 
            headers: CORS_HEADERS 
        });
    }

    // 只接受 POST
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
            status: 405,
            headers: CORS_HEADERS
        });
    }

    try {
        // 解析表单数据
        const formData = await request.formData();
        const password = formData.get('password');

        // 验证密码
        if (password === ADMIN_PASSWORD) {
            // 创建 session
            const sessionData = JSON.stringify({ isAdmin: true });
            const encodedSession = Buffer.from(sessionData).toString('base64');

            return new Response(JSON.stringify({ success: true }), {
                status: 200,
                headers: {
                    ...CORS_HEADERS,
                    'Set-Cookie': `adminSession=${encodedSession}; Path=/; HttpOnly; Max-Age=86400`
                }
            });
        } else {
            return new Response(JSON.stringify({ error: '管理员密码错误' }), {
                status: 401,
                headers: CORS_HEADERS
            });
        }
    } catch (error) {
        // 捕获任何异常并返回详细信息
        return new Response(JSON.stringify({
            error: '服务器内部错误',
            detail: error.message,
            stack: error.stack
        }), {
            status: 500,
            headers: CORS_HEADERS
        });
    }
}