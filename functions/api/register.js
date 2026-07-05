// cloud-functions/api/register.js
import { getUsers, saveUsers, findUserByUid, isValidUID, isValidPassword } from '../utils/db.js';

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
};

export async function onRequest(context) {
    const { request } = context;

    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
            status: 405,
            headers: CORS_HEADERS
        });
    }

    try {
        const formData = await request.formData();
        const uid = formData.get('uid');
        const name = formData.get('name');
        const gender = formData.get('gender');
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');

        if (!uid || !name || !gender || !password || !confirmPassword) {
            return new Response(JSON.stringify({ error: '请填写所有字段' }), {
                status: 400,
                headers: CORS_HEADERS
            });
        }

        if (password !== confirmPassword) {
            return new Response(JSON.stringify({ error: '两次密码输入不一致' }), {
                status: 400,
                headers: CORS_HEADERS
            });
        }

        if (!isValidUID(uid)) {
            return new Response(JSON.stringify({ error: 'UID格式错误，请参照：ml(或ms)+毕业年份+班级+学号，例如ml20300323' }), {
                status: 400,
                headers: CORS_HEADERS
            });
        }

        if (!isValidPassword(password)) {
            return new Response(JSON.stringify({ error: '密码必须包含大小写字母和数字，且长度至少8位' }), {
                status: 400,
                headers: CORS_HEADERS
            });
        }

        if (findUserByUid(uid)) {
            return new Response(JSON.stringify({ error: '该UID已被注册' }), {
                status: 400,
                headers: CORS_HEADERS
            });
        }

        const users = getUsers();
        users.push({ uid, name, gender, password });
        saveUsers(users);

        return new Response(JSON.stringify({ success: true, message: '注册成功' }), {
            status: 200,
            headers: CORS_HEADERS
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: '服务器错误', detail: error.message }), {
            status: 500,
            headers: CORS_HEADERS
        });
    }
}