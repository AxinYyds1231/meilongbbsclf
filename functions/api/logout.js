// functions/api/logout.js
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
};

export async function onRequest(context) {
    if (context.request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // 清除 session cookie
    const clearSession = 'session=; Path=/; Max-Age=0';
    const clearAdmin = 'adminSession=; Path=/; Max-Age=0';

    return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: {
            ...CORS_HEADERS,
            'Set-Cookie': [clearSession, clearAdmin]
        }
    });
}