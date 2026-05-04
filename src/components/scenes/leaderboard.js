// ============================================================
//  leaderboard.js  –  Wayfinder Leaderboard
//  - Tự hiện sau khi WIN, lấy thời gian từ game
//  - Tên lấy từ intro, không cần nhập lại
//  - Mỗi chế độ có storage key riêng
// ============================================================

// Storage keys riêng cho từng chế độ
const LB_KEYS = {
    motobike:   'lb-entries-motobike',
    pedestrian: 'lb-entries-pedestrian'
};

let lbEntries   = [];
let lbMode      = null;
let lbFilter    = 'all';
let lbOnRestart = null; // callback khi nhấn Chơi lại hoặc X

// ── Khởi tạo (gọi 1 lần trong constructor WayfinderManager) ─
export function initLeaderboard() {
    bindEvents();
}

// ── Gọi khi người chơi THẮNG ──────────────────────────────
//    playerName : lấy từ ô nhập tên ở intro
//    mode       : 'motobike' | 'pedestrian'
//    totalSec   : thời gian tính bằng giây
export function showLeaderboard(playerName, mode, totalSec, onRestart) {
    lbOnRestart = onRestart || null;
    lbMode = mode;

    // Lưu kết quả mới vào đúng storage của chế độ
    loadEntries(mode);
    lbEntries.push({
        id:       Date.now(),
        name:     playerName || 'Ẩn danh',
        totalSec: totalSec,
        date:     new Date().toLocaleDateString('vi-VN')
    });
    saveEntries(mode);

    // Hiển thị màn hình lb
    const screen = document.getElementById('leaderboard');
    if (screen) screen.classList.remove('hidden');

    // Cập nhật tiêu đề chế độ
    const modeLabel = document.getElementById('lb-mode-label');
    if (modeLabel) {
        modeLabel.textContent = mode === 'motobike' ? '🏍 Xe Máy' : '🚶 Đi Bộ';
    }

    // Reset filter về all rồi render
    setFilter('all');
}

// ── Đóng leaderboard ──────────────────────────────────────
export function hideLeaderboard() {
    const screen = document.getElementById('leaderboard');
    if (screen) screen.classList.add('hidden');
}

// ── Load / Save theo mode ─────────────────────────────────
function loadEntries(mode) {
    try {
        lbEntries = JSON.parse(localStorage.getItem(LB_KEYS[mode] || LB_KEYS.motobike) || '[]');
    } catch (e) {
        lbEntries = [];
    }
}

function saveEntries(mode) {
    localStorage.setItem(LB_KEYS[mode] || LB_KEYS.motobike, JSON.stringify(lbEntries));
}

// ── Bind sự kiện ──────────────────────────────────────────
function bindEvents() {
    // Nút đóng (X) → restart
    document.getElementById('lb-close-btn')
        ?.addEventListener('click', _doRestart);

    // Nút Chơi lại → restart
    document.getElementById('lb-retry-btn')
        ?.addEventListener('click', _doRestart);

    // Filter tabs
    document.querySelectorAll('.lb-filter-btn')
        .forEach(btn => btn.addEventListener('click', () => setFilter(btn.dataset.filter)));
}

function setFilter(filter) {
    lbFilter = filter;
    document.querySelectorAll('.lb-filter-btn')
        .forEach(b => b.classList.toggle('active', b.dataset.filter === filter));
    render();
}

// ── Restart callback ────────────────────────────────────────
function _doRestart() {
    if (lbOnRestart) lbOnRestart();
}

// ── Xóa entry ─────────────────────────────────────────────
function deleteEntry(id) {
    lbEntries = lbEntries.filter(e => e.id !== id);
    saveEntries(lbMode);
    render();
}
window.deleteEntry_lb = deleteEntry; // expose cho onclick inline

// ── Format thời gian ──────────────────────────────────────
function fmtTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ── Render ────────────────────────────────────────────────
function render() {
    const boardEl = document.getElementById('lb-board');
    const statsEl = document.getElementById('lb-stats');
    if (!boardEl) return;

    const sorted = [...lbEntries].sort((a, b) => a.totalSec - b.totalSec);

    // Stats
    if (statsEl) {
        const best = sorted.length ? fmtTime(sorted[0].totalSec) : '--:--';
        statsEl.innerHTML = `
            <span class="lb-stat">Tổng: <strong>${sorted.length}</strong></span>
            <span class="lb-stat">Tốt nhất: <strong>${best}</strong></span>
        `;
    }

    // Empty
    if (!sorted.length) {
        boardEl.innerHTML = `
            <div class="lb-empty">
                <div class="lb-empty-icon">🏁</div>
                <p>Chưa có kết quả nào.</p>
            </div>`;
        return;
    }

    // Avatar emoji pool based on rank
    const avatarEmojis = ['🧑‍🎓', '😎', '🦸', '🐱', '🦊', '🐸', '🤖', '👾'];

    boardEl.innerHTML = sorted.map((e, i) => {
        const rank    = i + 1;
        const medal   = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank;
        const rankCls = rank <= 3 ? `lb-entry--rank${rank}` : '';
        const avatar  = avatarEmojis[(e.name.charCodeAt(0) || 0) % avatarEmojis.length];

        return `
        <div class="lb-entry ${rankCls}" style="animation-delay:${i * 0.05}s; position:relative;">
            <div class="lb-rank-badge">${medal}</div>
            <div class="lb-avatar">${avatar}</div>
            <div class="lb-player-info">
                <span class="lb-name">${e.name}</span>
                <span class="lb-date">${e.date}</span>
            </div>
            <div class="lb-score-block">
                <span class="lb-star">⭐</span>
                <span class="lb-time-badge">${fmtTime(e.totalSec)}</span>
            </div>
            <button class="lb-delete" onclick="deleteEntry_lb(${e.id})" title="Xóa">✕</button>
        </div>`;
    }).join('');
}