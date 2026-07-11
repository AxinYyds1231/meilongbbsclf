// functions/api/register.js
import { createDb } from '../utils/db.js';

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
};

// SHA-256 哈希函数（浏览器/Cloudflare 原生支持）
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function onRequest(context) {
    const { request, env } = context;
    const db = createDb(env.USER_DATA);

    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: CORS_HEADERS });
    }
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: CORS_HEADERS });
    }

    try {
        const formData = await request.formData();
        const uid = formData.get('uid');
        const name = formData.get('name');
        const gender = formData.get('gender');
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');
        const grade = formData.get('grade');
        const cls = formData.get('class');

        if (!uid || !name || !gender || !password || !confirmPassword || !grade || !cls) {
            return new Response(JSON.stringify({ error: '请填写所有字段' }), { status: 400, headers: CORS_HEADERS });
        }
        if (password !== confirmPassword) {
            return new Response(JSON.stringify({ error: '两次密码输入不一致' }), { status: 400, headers: CORS_HEADERS });
        }
        if (!db.isValidUID(uid)) {
            return new Response(JSON.stringify({ error: 'UID格式错误' }), { status: 400, headers: CORS_HEADERS });
        }
        if (!db.isValidPassword(password)) {
            return new Response(JSON.stringify({ error: '密码必须包含大小写字母和数字，且长度至少8位' }), { status: 400, headers: CORS_HEADERS });
        }
        if (!db.isValidGrade(grade)) {
            return new Response(JSON.stringify({ error: '年级必须是6~9' }), { status: 400, headers: CORS_HEADERS });
        }
        if (!db.isValidClass(cls)) {
            return new Response(JSON.stringify({ error: '班级必须是1~13' }), { status: 400, headers: CORS_HEADERS });
        }

        const existing = await db.findUserByUid(uid);
        if (existing) {
            return new Response(JSON.stringify({ error: '该UID已被注册' }), { status: 400, headers: CORS_HEADERS });
        }

        // 哈希密码（SHA-256）
        const hashedPassword = await hashPassword(password);

        const users = await db.getUsers();
        users.push({
            uid,
            name,
            gender,
            password: hashedPassword,
            grade: parseInt(grade),
            class: parseInt(cls),
            points: 0,
            avatar: '',
            bio: ''
        });
        await db.saveUsers(users);

        return new Response(JSON.stringify({ success: true, message: '注册成功' }), { status: 200, headers: CORS_HEADERS });
    } catch (error) {
        return new Response(JSON.stringify({ error: '服务器错误', detail: error.message }), { status: 500, headers: CORS_HEADERS });
    }
}