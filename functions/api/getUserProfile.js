// functions/api/getUserProfile.js
import { createDb } from '../utils/db.js';
import { getLevel } from '../utils/level.js';

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
};

export async function onRequest(context) {
    const { request, env } = context;
    const db = createDb(env.USER_DATA);

    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: CORS_HEADERS });
    }
    if (request.method !== 'GET') {
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const uid = url.searchParams.get('uid');
    if (!uid) {
        return new Response(JSON.stringify({ error: '缺少UID' }), { status: 400, headers: CORS_HEADERS });
    }

    const user = await db.findUserByUid(uid);
    if (!user) {
        return new Response(JSON.stringify({ error: '用户不存在' }), { status: 404, headers: CORS_HEADERS });
    }

    const level = getLevel(user.points || 0);
    const profile = {
        uid: user.uid,
        name: user.name,
        gender: user.gender,
        grade: user.grade,
        class: user.class,
        avatar: user.avatar || '',
        bio: user.bio || '',
        points: user.points || 0,
        level: level.name,
        levelIcon: level.icon
    };
    return new Response(JSON.stringify({ user: profile }), { status: 200, headers: CORS_HEADERS });
}