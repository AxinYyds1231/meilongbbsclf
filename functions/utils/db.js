// functions/utils/db.js - KV 工厂版本（完整版）
export function createDb(kv) {
    const USERS_KEY = 'users';
    const POSTS_KEY = 'posts';
    const COUNTER_KEY = 'postCounter';

    async function getData(key) {
        if (!kv) return null;
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

    async function updateUser(uid, updates) {
        const users = await getUsers();
        const index = users.findIndex(u => u.uid === uid);
        if (index === -1) return null;
        users[index] = { ...users[index], ...updates };
        await saveUsers(users);
        return users[index];
    }

    async function deleteUser(uid) {
        let users = await getUsers();
        users = users.filter(u => u.uid !== uid);
        await saveUsers(users);
        return true;
    }

    // -------- 验证函数（同步）--------
    function isValidUID(uid) { /* ... 不变 ... */ }
    function isValidPassword(pwd) { /* ... 不变 ... */ }
    function isValidGrade(grade) { /* ... 不变 ... */ }
    function isValidClass(cls) { /* ... 不变 ... */ }

    // -------- 帖子相关 --------
    async function getPosts() {
        const posts = await getData(POSTS_KEY);
        return posts || [];
    }

    async function getPostById(id) {
        const posts = await getPosts();
        return posts.find(p => p.id === id);
    }

    async function createPost(title, content, authorUid, authorName, attachments = []) {
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
            status: 'pending', // 待审核
            attachments: attachments, // [{name, size, type, data: base64}]
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

    async function deletePost(postId) {
        let posts = await getPosts();
        const index = posts.findIndex(p => p.id === postId);
        if (index === -1) return false;
        posts.splice(index, 1);
        await setData(POSTS_KEY, posts);
        return true;
    }

    async function approvePost(postId) {
        const posts = await getPosts();
        const post = posts.find(p => p.id === postId);
        if (!post) return false;
        post.status = 'approved';
        await setData(POSTS_KEY, posts);
        return true;
    }

    async function rejectPost(postId) {
        const posts = await getPosts();
        const post = posts.find(p => p.id === postId);
        if (!post) return false;
        post.status = 'rejected';
        await setData(POSTS_KEY, posts);
        return true;
    }

    async function getPendingPosts() {
        const posts = await getPosts();
        return posts.filter(p => p.status === 'pending');
    }

    async function getApprovedPosts() {
        const posts = await getPosts();
        return posts.filter(p => p.status === 'approved');
    }

    return {
        getUsers,
        saveUsers,
        findUserByUid,
        updateUser,
        deleteUser,
        isValidUID,
        isValidPassword,
        isValidGrade,
        isValidClass,
        getPosts,
        getPostById,
        createPost,
        addReply,
        getPostsByUser,
        deletePost,
        approvePost,
        rejectPost,
        getPendingPosts,
        getApprovedPosts
    };
}