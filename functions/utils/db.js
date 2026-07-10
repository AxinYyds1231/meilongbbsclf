// functions/utils/db.js - KV 持久化版本
// 需要提前在 Cloudflare Pages 中绑定 KV 命名空间，变量名为 USER_DATA

const USERS_KEY = 'users';
const POSTS_KEY = 'posts';
const COUNTER_KEY = 'postCounter';

// -------- 辅助函数 --------
async function getData(key) {
    const value = await USER_DATA.get(key, 'json');
    return value || null;
}

async function setData(key, value) {
    await USER_DATA.put(key, JSON.stringify(value));
}

// -------- 用户相关 --------
export async function getUsers() {
    const users = await getData(USERS_KEY);
    return users || [];
}

export async function saveUsers(users) {
    await setData(USERS_KEY, users);
}

export async function findUserByUid(uid) {
    const users = await getUsers();
    return users.find(u => u.uid === uid);
}

// -------- 验证函数（同步）--------
export function isValidUID(uid) {
    const regex = /^(ml|ms)\d{4}\d{2}\d{2}$/;
    if (!regex.test(uid)) return false;
    const year = parseInt(uid.substring(2, 6));
    const cls = parseInt(uid.substring(6, 8));
    const num = parseInt(uid.substring(8, 10));
    return year >= 2024 && year <= 2040 && cls >= 1 && cls <= 12 && num >= 1 && num <= 99;
}

export function isValidPassword(pwd) {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(pwd);
}

export function isValidGrade(grade) {
    const g = parseInt(grade);
    return g >= 6 && g <= 9;
}

export function isValidClass(cls) {
    const c = parseInt(cls);
    return c >= 1 && c <= 13;
}

// -------- 帖子相关 --------
export async function getPosts() {
    const posts = await getData(POSTS_KEY);
    return posts || [];
}

export async function getPostById(id) {
    const posts = await getPosts();
    return posts.find(p => p.id === id);
}

export async function createPost(title, content, authorUid, authorName) {
    const posts = await getPosts();
    let counter = await getData(COUNTER_KEY);
    if (counter === null) counter = 1;
    else counter = parseInt(counter);
    const post = {
        id: counter++,
        title,
        content,
        authorUid,
        authorName,
        createdAt: Date.now(),
        replies: []
    };
    posts.unshift(post);
    await setData(POSTS_KEY, posts);
    await setData(COUNTER_KEY, counter);
    return post;
}

export async function addReply(postId, content, uid, name) {
    const posts = await getPosts();
    const post = posts.find(p => p.id === postId);
    if (!post) return null;
    post.replies.push({
        uid,
        name,
        content,
        createdAt: Date.now()
    });
    await setData(POSTS_KEY, posts);
    return post;
}

export async function getPostsByUser(uid) {
    const posts = await getPosts();
    return posts.filter(p => p.authorUid === uid);
}