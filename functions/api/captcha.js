// functions/api/captcha.js
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
};

export async function onRequest(context) {
    const { request, env } = context;

    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: CORS_HEADERS });
    }
    if (request.method !== 'GET') {
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: CORS_HEADERS });
    }

    try {
        // 生成四位随机数字验证码
        const code = String(Math.floor(1000 + Math.random() * 9000));
        const captchaId = 'captcha_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);

        // 存入 KV，有效期 5 分钟（300 秒）
        await env.USER_DATA.put(captchaId, code, { expirationTtl: 300 });

        return new Response(JSON.stringify({ captchaId, code }), {
            status: 200,
            headers: CORS_HEADERS
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: '服务器错误', detail: error.message }), {
            status: 500,
            headers: CORS_HEADERS
        });
    }
}