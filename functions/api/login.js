// functions/api/login.js
export async function onRequest(context) {
    // 解析请求体，打印日志方便调试
    let body = {};
    try {
        const formData = await context.request.formData();
        for (const [key, value] of formData.entries()) {
            body[key] = value;
        }
        console.log('收到登录请求:', body);
    } catch (e) {
        console.error('解析请求失败:', e);
    }

    return new Response(JSON.stringify({
        success: true,
        message: '登录接口工作正常！',
        received: body
    }), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        }
    });
}