// functions/utils/db.js
// 内存存储（每个实例独立，跨请求不共享，但保留接口）
let users = [];

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