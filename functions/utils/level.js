// functions/utils/level.js
export function getLevel(points) {
    if (points >= 1000) return { name: '资深成员', icon: '👑', minPoints: 1000 };
    if (points >= 500) return { name: '高级成员', icon: '🌟', minPoints: 500 };
    if (points >= 200) return { name: '中级成员', icon: '⭐', minPoints: 200 };
    if (points >= 50) return { name: '初级成员', icon: '📌', minPoints: 50 };
    return { name: '新手', icon: '🌱', minPoints: 0 };
}