// cloud-functions/utils/db.js
import fs from 'fs';
import path from 'path';

// EdgeOne 云函数环境可写的临时目录
const DATA_DIR = '/tmp/data';
const USER_DATA_PATH = path.join(DATA_DIR, 'users.json');

function ensureDataFile() {
    try {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        if (!fs.existsSync(USER_DATA_PATH)) {
            fs.writeFileSync(USER_DATA_PATH, JSON.stringify([]));
        }
    } catch (err) {
        console.error('创建数据文件失败:', err);
    }
}

export function getUsers() {
    ensureDataFile();
    try {
        const data = fs.readFileSync(USER_DATA_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (err) {
        console.error('读取数据失败:', err);
        return [];
    }
}

export function saveUsers(users) {
    ensureDataFile();
    try {
        fs.writeFileSync(USER_DATA_PATH, JSON.stringify(users, null, 2));
    } catch (err) {
        console.error('保存数据失败:', err);
    }
}

export function findUserByUid(uid) {
    const users = getUsers();
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