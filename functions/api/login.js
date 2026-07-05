// functions/api/login.js
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
};

// 硬编码测试用户
const TEST_USERS = [
    { uid: 'ml20300101', name: '张三', password: 'Test123456' },
    { uid: 'ml20300102', name: '李四', password: 'Test123456' }
];

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
        const uid = formData.get('uid');
        const password = formData.get('password');

        if (!uid || !password) {
            return new Response(JSON.stringify({ error: '请填写完整信息' }), {
                status: 400,
                headers: CORS_HEADERS
            });
        }

        const user = TEST_USERS.find(u => u.uid === uid && u.password === password);

        if (user) {
            const sessionData = JSON.stringify({ uid: user.uid, name: user.name });
            const encodedSession = Buffer.from(sessionData).toString('base64');
            // Cookie 设置：Path=/ 确保全站可访问
            const cookie = `session=${encodedSession}; Path=/; HttpOnly; Max-Age=86400; SameSite=Lax`;

            return new Response(JSON.stringify({
                success: true,
                user: { uid: user.uid, name: user.name }
            }), {
                status: 200,
                headers: {
                    ...CORS_HEADERS,
                    'Set-Cookie': cookie
                }
            });
        } else {
            return new Response(JSON.stringify({ error: '账号或密码错误' }), {
                status: 401,
                headers: CORS_HEADERS
            });
        }
    } catch (error) {
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