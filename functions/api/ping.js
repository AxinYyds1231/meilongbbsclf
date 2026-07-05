// functions/api/ping.js
export async function onRequest(context) {
    return new Response(JSON.stringify({ message: 'pong' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
}