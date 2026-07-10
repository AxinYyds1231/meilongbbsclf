// functions/utils/db.js
let users = [];
let posts = [];
let postIdCounter = 1;

export function getUsers() {
    return users;
}

export function saveUsers(newUsers) {
    users = newUsers;
}

export function findUserByUid(uid) {
    return users.find(u => u.uid === uid);
}

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

// ============ 帖子相关 ============
export function getPosts() {
    return posts;
}

export function getPostById(id) {
    return posts.find(p => p.id === id);
}

export function createPost(title, content, authorUid, authorName) {
    const post = {
        id: postIdCounter++,
        title,
        content,
        authorUid,
        authorName,
        createdAt: Date.now(),
        replies: []
    };
    posts.unshift(post); // 最新在前
    return post;
}

export function addReply(postId, content, uid, name) {
    const post = getPostById(postId);
    if (!post) return null;
    post.replies.push({
        uid,
        name,
        content,
        createdAt: Date.now()
    });
    return post;
}

export function getPostsByUser(uid) {
    return posts.filter(p => p.authorUid === uid);
}