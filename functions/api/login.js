// functions/api/login.js
export async function onRequest(context) {
    return new Response(JSON.stringify({
        success: true,
        message: 'login.js 工作正常！'
    }), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        }
    });
}