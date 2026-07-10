// functions/api/updateUser.js
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
    const sessionMatch = cookieHeader.match(/session=([^;]+)/);
    if (!sessionMatch) {
        return new Response(JSON.stringify({ error: '请先登录' }), {
            status: 401,
            headers: CORS_HEADERS
        });
    }

    try {
        const sessionData = JSON.parse(base64ToUtf8(sessionMatch[1]));
        const { uid } = sessionData;

        const formData = await request.formData();
        const name = formData.get('name');
        const gender = formData.get('gender');
        const grade = formData.get('grade');
        const cls = formData.get('class');

        if (!name || !gender || !grade || !cls) {
            return new Response(JSON.stringify({ error: '请填写完整信息' }), {
                status: 400,
                headers: CORS_HEADERS
            });
        }

        if (!db.isValidGrade(grade)) {
            return new Response(JSON.stringify({ error: '年级必须是6~9' }), {
                status: 400,
                headers: CORS_HEADERS
            });
        }
        if (!db.isValidClass(cls)) {
            return new Response(JSON.stringify({ error: '班级必须是1~13' }), {
                status: 400,
                headers: CORS_HEADERS
            });
        }

        const updatedUser = await db.updateUser(uid, {
            name,
            gender,
            grade: parseInt(grade),
            class: parseInt(cls)
        });

        if (!updatedUser) {
            return new Response(JSON.stringify({ error: '用户不存在' }), {
                status: 404,
                headers: CORS_HEADERS
            });
        }

        // 更新 session 中的 name
        const newSessionData = JSON.stringify({ uid: updatedUser.uid, name: updatedUser.name });
        const encoded = btoa(newSessionData);
        const cookie = `session=${encoded}; Path=/; HttpOnly; Max-Age=86400; SameSite=Lax`;

        return new Response(JSON.stringify({ success: true, user: updatedUser }), {
            status: 200,
            headers: {
                ...CORS_HEADERS,
                'Set-Cookie': cookie
            }
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