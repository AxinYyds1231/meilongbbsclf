// functions/api/test.js
export async function onRequest(context) {
    return new Response(JSON.stringify({
        status: 'ok',
        message: 'Cloudflare Pages Functions 工作正常！'
    }), {
        status: 200,
        headers: {
            'Content-Type': 'application/json'
        }
    });
}