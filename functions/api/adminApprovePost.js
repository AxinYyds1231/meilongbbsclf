// functions/api/adminApprovePost.js
import { createDb } from '../utils/db.js';

function base64ToUtf8(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
}

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
};

export async function onRequest(context) {
    const { request, env } = context;
    const db = createDb(env.USER_DATA);

    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
            status: 405,
            headers: CORS_HEADERS
        });
    }

    const cookieHeader = request.headers.get('Cookie') || '';
    const adminMatch = cookieHeader.match(/adminSession=([^;]+)/);
    if (!adminMatch) {
        return new Response(JSON.stringify({ error: '未登录' }), {
            status: 401,
            headers: CORS_HEADERS
        });
    }

    try {
        const adminData = JSON.parse(base64ToUtf8(adminMatch[1]));
        if (!adminData.isAdmin) {
            return new Response(JSON.stringify({ error: '无权限' }), {
                status: 403,
                headers: CORS_HEADERS
            });
        }

        const formData = await request.formData();
        const postId = parseInt(formData.get('postId'));
        const action = formData.get('action'); // 'approve' or 'reject'

        if (!postId || !action) {
            return new Response(JSON.stringify({ error: '参数不完整' }), {
                status: 400,
                headers: CORS_HEADERS
            });
        }

        let success;
        if (action === 'approve') {
            success = await db.approvePost(postId);
        } else if (action === 'reject') {
            success = await db.rejectPost(postId);
        } else {
            return new Response(JSON.stringify({ error: '无效操作' }), {
                status: 400,
                headers: CORS_HEADERS
            });
        }

        if (!success) {
            return new Response(JSON.stringify({ error: '帖子不存在' }), {
                status: 404,
                headers: CORS_HEADERS
            });
        }

        return new Response(JSON.stringify({ success: true, message: `已${action === 'approve' ? '通过' : '拒绝'}` }), {
            status: 200,
            headers: CORS_HEADERS
        });
    } catch (error) {
        return new Response(JSON.stringify({
            error: '服务器错误',
            detail: error.message
        }), {
            status: 500,
            headers: CORS_HEADERS
        });
    }
}