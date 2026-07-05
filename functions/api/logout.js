// cloud-functions/api/logout.js
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

    return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: {
            ...CORS_HEADERS,
            'Set-Cookie': 'session=; Path=/; HttpOnly; Max-Age=0'
        }
    });
}