// functions/api/uploadFile.js - 简单文件上传，返回附件信息
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
};

// 限制单个文件 2MB
const MAX_FILE_SIZE = 2 * 1024 * 1024;

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
        const file = formData.get('file');
        if (!file) {
            return new Response(JSON.stringify({ error: '未选择文件' }), {
                status: 400,
                headers: CORS_HEADERS
            });
        }

        // 检查大小
        if (file.size > MAX_FILE_SIZE) {
            return new Response(JSON.stringify({ error: `文件大小超过限制 (最大 ${MAX_FILE_SIZE / 1024 / 1024}MB)` }), {
                status: 400,
                headers: CORS_HEADERS
            });
        }

        // 读取文件内容为 base64
        const arrayBuffer = await file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        const base64Data = btoa(binary);

        // 返回附件信息
        const attachment = {
            name: file.name,
            size: file.size,
            type: file.type || 'application/octet-stream',
            data: base64Data
        };

        return new Response(JSON.stringify({ success: true, attachment }), {
            status: 200,
            headers: CORS_HEADERS
        });
    } catch (error) {
        return new Response(JSON.stringify({
            error: '上传失败',
            detail: error.message
        }), {
            status: 500,
            headers: CORS_HEADERS
        });
    }
}