// functions/utils/db.js - KV 工厂版本
// 导出函数，接收 kv 实例，返回操作对象

export function createDb(kv) {
    const USERS_KEY = 'users';
    const POSTS_KEY = 'posts';
    const COUNTER_KEY = 'postCounter';

    async function getData(key) {
        if (!kv) {
            console.error('KV 未初始化');
            return null;
        }
        const value = await kv.get(key, 'json');
        return value || null;
    }

    async function setData(key, value) {
        if (!kv) return;
        await kv.put(key, JSON.stringify(value));
    }

    // -------- 用户相关 --------
    async function getUsers() {
        const users = await getData(USERS_KEY);
        return users || [];
    }

    async function saveUsers(users) {
        await setData(USERS_KEY, users);
    }

    async function findUserByUid(uid) {
        const users = await getUsers();
        return users.find(u => u.uid === uid);
    }

    // -------- 验证函数（同步）--------
    function isValidUID(uid) {
        const regex = /^(ml|ms)\d{4}\d{2}\d{2}$/;
        if (!regex.test(uid)) return false;
        const year = parseInt(uid.substring(2, 6));
        const cls = parseInt(uid.substring(6, 8));
        const num = parseInt(uid.substring(8, 10));
        return year >= 2024 && year <= 2040 && cls >= 1 && cls <= 12 && num >= 1 && num <= 99;
    }

    function isValidPassword(pwd) {
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(pwd);
    }

    function isValidGrade(grade) {
        const g = parseInt(grade);
        return g >= 6 && g <= 9;
    }

    function isValidClass(cls) {
        const c = parseInt(cls);
        return c >= 1 && c <= 13;
    }

    // -------- 帖子相关 --------
    async function getPosts() {
        const posts = await getData(POSTS_KEY);
        return posts || [];
    }

    async function getPostById(id) {
        const posts = await getPosts();
        return posts.find(p => p.id === id);
    }

    async function createPost(title, content, authorUid, authorName) {
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

    async function addReply(postId, content, uid, name) {
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

    async function getPostsByUser(uid) {
        const posts = await getPosts();
        return posts.filter(p => p.authorUid === uid);
    }

    return {
        getUsers,
        saveUsers,
        findUserByUid,
        isValidUID,
        isValidPassword,
        isValidGrade,
        isValidClass,
        getPosts,
        getPostById,
        createPost,
        addReply,
        getPostsByUser
    };
}