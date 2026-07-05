// functions/api/login.js
export async function onRequest(context) {
    const { request } = context;

    // 处理 OPTIONS 预检
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            }
        });
    }

    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
            status: 405,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }

    try {
        const formData = await request.formData();
        const uid = formData.get('uid');
        const password = formData.get('password');

        // 硬编码测试用户
        const validUsers = [
            { uid: 'ml20300101', name: '张三', pwd: 'Test123456' }
        ];

        const user = validUsers.find(u => u.uid === uid && u.pwd === password);

        if (user) {
            const sessionData = JSON.stringify({ uid: user.uid, name: user.name });
            // 使用 btoa 替代 Buffer
            const encoded = btoa(sessionData);
            const cookie = `session=${encoded}; Path=/; HttpOnly; Max-Age=86400; SameSite=Lax`;

            return new Response(JSON.stringify({
                success: true,
                user: { uid: user.uid, name: user.name }
            }), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Set-Cookie': cookie
                }
            });
        } else {
            return new Response(JSON.stringify({ error: '账号或密码错误' }), {
                status: 401,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }
    } catch (err) {
        return new Response(JSON.stringify({
            error: '服务器内部错误',
            detail: err.message,
            stack: err.stack
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}