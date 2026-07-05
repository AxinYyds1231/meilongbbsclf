// functions/api/login.js
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
};

export async function onRequest(context) {
    return new Response(JSON.stringify({
        success: true,
        message: 'login.js 工作正常！'
    }), {
        status: 200,
        headers: CORS_HEADERS
    });
}