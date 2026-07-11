// functions/utils/db.js
export function createDb(kv) {
    const USERS_KEY = 'users';
    const POSTS_KEY = 'posts';
    const COUNTER_KEY = 'postCounter';
    const CATEGORIES_KEY = 'categories';
    const MESSAGES_KEY = 'messages';
    const NOTIFICATIONS_KEY = 'notifications';
    const ADMIN_PASSWORD_KEY = 'admin_password_hash';
    const CHECKIN_PREFIX = 'checkin_';

    async function getData(key) {
        if (!kv) return null;
        const value = await kv.get(key, 'json');
        return value || null;
    }
    async function setData(key, value) {
        if (!kv) return;
        await kv.put(key, JSON.stringify(value));
    }

    // ---- 用户 ----
    async function getUsers() { return (await getData(USERS_KEY)) || []; }
    async function saveUsers(users) { await setData(USERS_KEY, users); }
    async function findUserByUid(uid) {
        const users = await getUsers();
        return users.find(u => u.uid === uid);
    }
    async function updateUser(uid, updates) {
        const users = await getUsers();
        const idx = users.findIndex(u => u.uid === uid);
        if (idx === -1) return null;
        users[idx] = { ...users[idx], ...updates };
        await saveUsers(users);
        return users[idx];
    }
    async function deleteUser(uid) {
        let users = await getUsers();
        users = users.filter(u => u.uid !== uid);
        await saveUsers(users);
        return true;
    }
    async function addPoints(uid, points) {
        const user = await findUserByUid(uid);
        if (!user) return null;
        const newPoints = (user.points || 0) + points;
        await updateUser(uid, { points: newPoints });
        return newPoints;
    }

    // ---- 验证 ----
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
        const map = { '六年级':6, '七年级':7, '八年级':8, '九年级':9, '6':6, '7':7, '8':8, '9':9 };
        const key = String(grade);
        if (map[key] !== undefined) return true;
        const num = parseInt(grade);
        return num >= 6 && num <= 9;
    }
    function isValidClass(cls) {
        const num = parseInt(cls);
        return num >= 1 && num <= 13;
    }

    // ---- 分类 ----
    async function getCategories() { return (await getData(CATEGORIES_KEY)) || []; }
    async function saveCategories(cats) { await setData(CATEGORIES_KEY, cats); }
    async function getCategoryById(id) {
        const cats = await getCategories();
        return cats.find(c => c.id === id);
    }
    async function createCategory(name, desc) {
        const cats = await getCategories();
        const id = cats.length ? Math.max(...cats.map(c => c.id)) + 1 : 1;
        const newCat = { id, name: name.trim(), description: desc ? desc.trim() : '', created_at: Date.now() };
        cats.push(newCat);
        await saveCategories(cats);
        return newCat;
    }
    async function updateCategory(id, name, desc) {
        const cats = await getCategories();
        const idx = cats.findIndex(c => c.id === id);
        if (idx === -1) return null;
        cats[idx].name = name.trim();
        cats[idx].description = desc ? desc.trim() : '';
        await saveCategories(cats);
        return cats[idx];
    }
    async function deleteCategory(id) {
        let cats = await getCategories();
        cats = cats.filter(c => c.id !== id);
        await saveCategories(cats);
        return true;
    }

    // ---- 帖子 ----
    async function getPosts() { return (await getData(POSTS_KEY)) || []; }
    async function savePosts(posts) { await setData(POSTS_KEY, posts); }
    async function getPostById(id) {
        const posts = await getPosts();
        return posts.find(p => p.id === id);
    }
    async function createPost(title, content, authorUid, authorName, attachments = [], categoryId = 0) {
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
            categoryId,
            attachments,
            replies: [],
            deleted: false,
            deleteReason: null,
            deletedBy: null,
            likes: [],
            dislikes: []
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
        const reply = {
            uid,
            name,
            content,
            createdAt: Date.now(),
            likes: [],
            dislikes: []
        };
        post.replies.push(reply);
        await setData(POSTS_KEY, posts);
        return reply;
    }
    async function deletePostById(postId, reason, adminUid) {
        const posts = await getPosts();
        const post = posts.find(p => p.id === postId);
        if (!post) return false;
        post.deleted = true;
        post.deleteReason = reason;
        post.deletedBy = adminUid;
        await setData(POSTS_KEY, posts);
        return true;
    }
    async function toggleLike(postId, uid, type) {
        const posts = await getPosts();
        const post = posts.find(p => p.id === postId);
        if (!post) return null;
        const list = type === 'like' ? post.likes : post.dislikes;
        const oppositeList = type === 'like' ? post.dislikes : post.likes;
        const idx = list.indexOf(uid);
        if (idx !== -1) {
            list.splice(idx, 1);
        } else {
            const oppIdx = oppositeList.indexOf(uid);
            if (oppIdx !== -1) oppositeList.splice(oppIdx, 1);
            list.push(uid);
        }
        await setData(POSTS_KEY, posts);
        return post;
    }
    async function toggleReplyLike(postId, replyIndex, uid, type) {
        const posts = await getPosts();
        const post = posts.find(p => p.id === postId);
        if (!post || !post.replies[replyIndex]) return null;
        const reply = post.replies[replyIndex];
        const list = type === 'like' ? reply.likes : reply.dislikes;
        const oppositeList = type === 'like' ? reply.dislikes : reply.likes;
        const idx = list.indexOf(uid);
        if (idx !== -1) {
            list.splice(idx, 1);
        } else {
            const oppIdx = oppositeList.indexOf(uid);
            if (oppIdx !== -1) oppositeList.splice(oppIdx, 1);
            list.push(uid);
        }
        await setData(POSTS_KEY, posts);
        return reply;
    }

    // ---- 私信 ----
    async function getMessages() { return (await getData(MESSAGES_KEY)) || []; }
    async function saveMessages(msgs) { await setData(MESSAGES_KEY, msgs); }
    async function sendMessage(fromUid, toUid, content) {
        const msgs = await getMessages();
        const msg = {
            id: msgs.length ? Math.max(...msgs.map(m => m.id)) + 1 : 1,
            fromUid,
            toUid,
            content,
            sentAt: Date.now(),
            read: false
        };
        msgs.push(msg);
        await saveMessages(msgs);
        return msg;
    }
    async function getInbox(uid) {
        const msgs = await getMessages();
        return msgs.filter(m => m.toUid === uid).sort((a, b) => b.sentAt - a.sentAt);
    }
    async function markMessageRead(msgId) {
        const msgs = await getMessages();
        const msg = msgs.find(m => m.id === msgId);
        if (msg) { msg.read = true; await saveMessages(msgs); return true; }
        return false;
    }
    async function deleteMessage(msgId, uid) {
        const msgs = await getMessages();
        const idx = msgs.findIndex(m => m.id === msgId);
        if (idx === -1) return false;
        if (msgs[idx].toUid !== uid) return false;
        msgs.splice(idx, 1);
        await saveMessages(msgs);
        return true;
    }

    // ---- 通知 ----
    async function getNotifications() { return (await getData(NOTIFICATIONS_KEY)) || []; }
    async function saveNotifications(notifs) { await setData(NOTIFICATIONS_KEY, notifs); }
    async function addNotification(uid, type, content, link = '') {
        const notifs = await getNotifications();
        const notif = {
            id: notifs.length ? Math.max(...notifs.map(n => n.id)) + 1 : 1,
            uid,
            type,
            content,
            link,
            createdAt: Date.now(),
            read: false
        };
        notifs.push(notif);
        await saveNotifications(notifs);
        return notif;
    }
    async function getNotificationsForUser(uid) {
        const notifs = await getNotifications();
        return notifs.filter(n => n.uid === uid).sort((a, b) => b.createdAt - a.createdAt);
    }
    async function markNotificationRead(notifId) {
        const notifs = await getNotifications();
        const n = notifs.find(n => n.id === notifId);
        if (n) { n.read = true; await saveNotifications(notifs); return true; }
        return false;
    }

    // ---- 管理员密码 ----
    async function getAdminPasswordHash() { return await getData(ADMIN_PASSWORD_KEY) || null; }
    async function setAdminPasswordHash(hash) { await setData(ADMIN_PASSWORD_KEY, hash); }

    // ---- 签到 ----
    async function getCheckinData(uid) {
        const key = CHECKIN_PREFIX + uid;
        return await getData(key) || null;
    }
    async function setCheckinData(uid, data) {
        const key = CHECKIN_PREFIX + uid;
        await setData(key, data);
    }
    async function getTodayCheckinStatus(uid) {
        const data = await getCheckinData(uid);
        if (!data) return { checked: false, streak: 0, lastDate: null };
        const today = new Date().toISOString().slice(0, 10);
        const checked = data.lastDate === today;
        return { checked, streak: data.streak || 0, lastDate: data.lastDate };
    }
    async function doCheckin(uid) {
        const today = new Date().toISOString().slice(0, 10);
        const status = await getTodayCheckinStatus(uid);
        if (status.checked) {
            return { success: false, message: '今日已签到', streak: status.streak };
        }
        let streak = status.streak || 0;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().slice(0, 10);
        if (status.lastDate === yesterdayStr) {
            streak += 1;
        } else {
            streak = 1;
        }
        await setCheckinData(uid, { lastDate: today, streak });
        let pointsEarned = 5;
        if (streak % 7 === 0) pointsEarned += 10;
        await addPoints(uid, pointsEarned);
        return { success: true, message: `签到成功！获得 ${pointsEarned} 积分`, streak, pointsEarned };
    }

    // ---- 导出 ----
    return {
        getUsers, saveUsers, findUserByUid, updateUser, deleteUser, addPoints,
        isValidUID, isValidPassword, isValidGrade, isValidClass,
        getCategories, saveCategories, getCategoryById, createCategory, updateCategory, deleteCategory,
        getPosts, savePosts, getPostById, createPost, addReply, deletePostById,
        toggleLike, toggleReplyLike,
        getMessages, saveMessages, sendMessage, getInbox, markMessageRead, deleteMessage,
        getNotifications, saveNotifications, addNotification, getNotificationsForUser, markNotificationRead,
        getAdminPasswordHash, setAdminPasswordHash,
        getTodayCheckinStatus, doCheckin
    };
}