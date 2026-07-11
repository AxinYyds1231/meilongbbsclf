// functions/api/uploadAvatar.js
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

const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB

export async function onRequest(context) {
    const { request, env } = context;
    const db = createDb(env.USER_DATA);

    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: CORS_HEADERS });
    }
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: CORS_HEADERS });
    }

    const cookieHeader = request.headers.get('Cookie') || '';
    const sessionMatch = cookieHeader.match(/session=([^;]+)/);
    if (!sessionMatch) {
        return new Response(JSON.stringify({ error: '请先登录' }), { status: 401, headers: CORS_HEADERS });
    }

    try {
        const sessionData = JSON.parse(base64ToUtf8(sessionMatch[1]));
        const uid = sessionData.uid;

        const formData = await request.formData();
        const file = formData.get('avatar');
        if (!file) {
            return new Response(JSON.stringify({ error: '未选择图片' }), { status: 400, headers: CORS_HEADERS });
        }

        if (!file.type.startsWith('image/')) {
            return new Response(JSON.stringify({ error: '请上传图片文件' }), { status: 400, headers: CORS_HEADERS });
        }

        if (file.size > MAX_AVATAR_SIZE) {
            return new Response(JSON.stringify({ error: `图片大小不能超过 ${MAX_AVATAR_SIZE / 1024 / 1024}MB` }), { status: 400, headers: CORS_HEADERS });
        }

        const arrayBuffer = await file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);
        const avatarData = `data:${file.type};base64,${base64}`;

        const updatedUser = await db.updateUser(uid, { avatar: avatarData });
        if (!updatedUser) {
            return new Response(JSON.stringify({ error: '用户不存在' }), { status: 404, headers: CORS_HEADERS });
        }

        // 更新 session 中的头像（可选，但为了实时显示，可在前端重新请求）
        return new Response(JSON.stringify({ success: true, avatar: avatarData }), {
            status: 200,
            headers: CORS_HEADERS
        });
    } catch (error) {
        return new Response(JSON.stringify({
            error: '服务器错误',
            detail: error.message
        }), { status: 500, headers: CORS_HEADERS });
    }
}