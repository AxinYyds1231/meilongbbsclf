// functions/api/adminUpdateUser.js
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
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: CORS_HEADERS });
    }

    const cookieHeader = request.headers.get('Cookie') || '';
    const adminMatch = cookieHeader.match(/adminSession=([^;]+)/);
    if (!adminMatch) {
        return new Response(JSON.stringify({ error: '未登录' }), { status: 401, headers: CORS_HEADERS });
    }

    try {
        const adminData = JSON.parse(base64ToUtf8(adminMatch[1]));
        if (!adminData.isAdmin) {
            return new Response(JSON.stringify({ error: '无权限' }), { status: 403, headers: CORS_HEADERS });
        }

        const formData = await request.formData();
        const targetUid = formData.get('uid');
        const name = formData.get('name');
        const gender = formData.get('gender');
        const grade = formData.get('grade');
        const cls = formData.get('class');

        if (!targetUid || !name || !gender || !grade || !cls) {
            return new Response(JSON.stringify({ error: '请填写完整信息' }), { status: 400, headers: CORS_HEADERS });
        }

        if (!db.isValidGrade(grade)) {
            return new Response(JSON.stringify({ error: '年级必须是6~9' }), { status: 400, headers: CORS_HEADERS });
        }
        if (!db.isValidClass(cls)) {
            return new Response(JSON.stringify({ error: '班级必须是1~13' }), { status: 400, headers: CORS_HEADERS });
        }

        const updatedUser = await db.updateUser(targetUid, {
            name,
            gender,
            grade: parseInt(grade),
            class: parseInt(cls)
        });

        if (!updatedUser) {
            return new Response(JSON.stringify({ error: '用户不存在' }), { status: 404, headers: CORS_HEADERS });
        }

        return new Response(JSON.stringify({ success: true, user: updatedUser }), {
            status: 200,
            headers: CORS_HEADERS
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: '服务器错误', detail: error.message }), { status: 500, headers: CORS_HEADERS });
    }
}