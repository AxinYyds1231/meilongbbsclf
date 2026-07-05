// functions/api/login.js
// 完全独立版本，不依赖外部文件

// 内存存储（和 db.js 共享数据需要保持同步，这里直接用同一个内存变量）
// 注意：如果在多个文件中分别定义内存变量，数据会不一致
// 所以这里的 users 其实应该和 db.js 共用同一个引用

// 为了解决这个问题，我们直接在这里重新实现一份，暂时不和 db.js 耦合

// 实际上，更好的方式：所有 API 都用同一个内存数据源。
// 我们在这里直接使用内存，但注册时数据保存在这里，登录时也从这里读。
// 但问题是 register.js 可能写入的是 db.js 的内存，而不是这里的内存。
// 所以必须统一数据源。

// 最稳妥的方案：所有 API 都从同一个地方读写数据。
// 我们直接改造：所有 API 都用 db.js，但确保 db.js 是内存版本且正常工作。
// 但既然 adminLogin 没问题了，login 的问题可能出在 db.js 的导出/导入上。

// 让我们先用一个临时方案：login.js 也完全不依赖 db.js，把用户数据写在一个全局变量里
// 但 register.js 和 login.js 需要共享数据，所以必须让它们用同一个内存对象。

// 最佳实践：在 Cloudflare Functions 环境中，使用全局对象来共享数据。
// 在 Worker 中，每个请求是独立的，但同一个 Worker 实例可以共享内存。

// 我们用一个全局对象来存储用户数据
// 这样所有的 API 都能访问到同一个数据源

// 解决方案：创建一个共享的数据模块，所有 API 都从同一个模块导入数据。
// 但为了简化，我直接让 login.js 和 register.js 都用同一个 db.js，
// 但确保 db.js 是纯内存版本且没有语法错误。

// 所以还是用 db.js，但确保它没问题。
// 先提供修复后的 db.js（之前给过了），然后 login.js 正常导入。

// ---------- 上面是思路，下面是实际代码 ----------

import { getUsers } from '../utils/db.js';

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
};

export async function onRequest(context) {
    const { request } = context;

    // 预检请求
    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // 只接受 POST
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
            status: 405,
            headers: CORS_HEADERS
        });
    }

    try {
        // 解析表单
        const formData = await request.formData();
        const uid = formData.get('uid');
        const password = formData.get('password');

        // 验证必填
        if (!uid || !password) {
            return new Response(JSON.stringify({ error: '请填写完整信息' }), {
                status: 400,
                headers: CORS_HEADERS
            });
        }

        // 从内存中获取用户列表（来自 db.js）
        const users = getUsers();
        console.log('当前用户数:', users.length); // 调试日志

        // 查找匹配的用户
        const user = users.find(u => u.uid === uid && u.password === password);

        if (user) {
            // 登录成功，创建 session
            const sessionData = JSON.stringify({ uid: user.uid, name: user.name });
            const encodedSession = Buffer.from(sessionData).toString('base64');

            return new Response(JSON.stringify({
                success: true,
                user: { uid: user.uid, name: user.name }
            }), {
                status: 200,
                headers: {
                    ...CORS_HEADERS,
                    'Set-Cookie': `session=${encodedSession}; Path=/; HttpOnly; Max-Age=86400`
                }
            });
        } else {
            // 用户不存在或密码错误
            return new Response(JSON.stringify({ error: '账号或密码错误' }), {
                status: 401,
                headers: CORS_HEADERS
            });
        }
    } catch (error) {
        // 捕获任何异常，返回详细错误
        return new Response(JSON.stringify({
            error: '服务器内部错误',
            detail: error.message,
            stack: error.stack
        }), {
            status: 500,
            headers: CORS_HEADERS
        });
    }
}