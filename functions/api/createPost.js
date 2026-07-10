// functions/api/createPost.js
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
        const { uid, name } = sessionData;

        const formData = await request.formData();
        const title = formData.get('title');
        const content = formData.get('content');
        const attachmentsJson = formData.get('attachments');

        if (!title || !content) {
            return new Response(JSON.stringify({ error: '标题和内容不能为空' }), {
                status: 400,
                headers: CORS_HEADERS
            });
        }

        // 字数限制
        if (content.length > 1000) {
            return new Response(JSON.stringify({ error: '内容超过1000字限制' }), {
                status: 400,
                headers: CORS_HEADERS
            });
        }

        let attachments = [];
        if (attachmentsJson) {
            try {
                attachments = JSON.parse(attachmentsJson);
                // 检查附件总大小
                let totalSize = 0;
                for (let att of attachments) {
                    totalSize += att.size;
                }
                if (totalSize > 5 * 1024 * 1024) {
                    return new Response(JSON.stringify({ error: '附件总大小不能超过5MB' }), {
                        status: 400,
                        headers: CORS_HEADERS
                    });
                }
            } catch (e) {
                return new Response(JSON.stringify({ error: '附件数据格式错误' }), {
                    status: 400,
                    headers: CORS_HEADERS
                });
            }
        }

        const post = await db.createPost(title, content, uid, name, attachments);
        return new Response(JSON.stringify({ success: true, post }), {
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