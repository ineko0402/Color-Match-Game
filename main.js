"use strict";

/** @typedef {{r:number,g:number,b:number}} Color */

const state = {
    r: 128,
    g: 128,
    b: 128,
    target: null
};

/**
 * ランダム色生成
 * @returns {Color}
 */
function generateColor() {
    return {
        r: Math.floor(Math.random() * 256),
        g: Math.floor(Math.random() * 256),
        b: Math.floor(Math.random() * 256)
    };
}

/**
 * 色差計算
 * @param {Color} a
 * @param {Color} b
 * @returns {number}
 */
function calculateDifference(a, b) {
    const dr = a.r - b.r;
    const dg = a.g - b.g;
    const db = a.b - b.b;
    return Math.sqrt(dr * dr + dg * dg + db * db);
}

/**
 * スコア計算
 * @param {number} diff
 * @returns {number}
 */
function calculateScore(diff) {
    return Math.max(0, Math.floor(100 - diff));
}

/**
 * ランク評価
 * @param {number} diff
 * @returns {string}
 */
function evaluateRank(diff) {
    if (diff <= 10) return "S";
    if (diff <= 25) return "A";
    if (diff <= 50) return "B";
    if (diff <= 80) return "C";
    return "D";
}

/**
 * CSSカラー変換
 * @param {Color} c
 * @returns {string}
 */
function toCss(c) {
    return `rgb(${c.r},${c.g},${c.b})`;
}

/**
 * UI更新
 * @returns {void}
 */
function updateUI() {
    const current = { r: state.r, g: state.g, b: state.b };

    document.getElementById("resultColor").style.background = toCss(current);
    document.getElementById("target").style.background = toCss(state.target);

    document.getElementById("rVal").textContent = state.r;
    document.getElementById("gVal").textContent = state.g;
    document.getElementById("bVal").textContent = state.b;
    
    document.getElementById("rFill").style.height = state.r / 255 * 100 + "%";
    document.getElementById("gFill").style.height = state.g / 255 * 100 + "%";
    document.getElementById("bFill").style.height = state.b / 255 * 100 + "%";
    
    document.querySelector(".r").style.background = `rgba(${state.r},0,0,0.4)`;
    document.querySelector(".g").style.background = `rgba(0,${state.g},0,0.4)`;
    document.querySelector(".b").style.background = `rgba(0,0,${state.b},0.4)`;
}

/**
 * 値変更
 * @param {"r"|"g"|"b"} key
 * @param {number} delta
 * @returns {void}
 */
function changeValue(key, delta) {
    const next = state[key] + delta;
    state[key] = Math.max(0, Math.min(255, next));
    updateUI();
}

/**
 * 入力設定（スワイプ＋タップ）
 * @returns {void}
 */
function setupInput() {
    document.querySelectorAll(".zone").forEach(zone => {

        let startY = 0;
        let moved = false;

        zone.addEventListener("touchstart", e => {
            e.preventDefault();
            startY = e.touches[0].clientY;
            moved = false;
        }, { passive: false });

        zone.addEventListener("touchmove", e => {
            e.preventDefault();

            const currentY = e.touches[0].clientY;
            const diff = startY - currentY;
            const key = zone.dataset.color;

            const delta = Math.floor(diff / 8);

            if (delta !== 0) {
                changeValue(key, delta);
                startY = currentY;
                moved = true;
            }
        }, { passive: false });

        zone.addEventListener("touchend", e => {
            if (moved === true) {
                return;
            }

            const rect = zone.getBoundingClientRect();
            const touch = e.changedTouches[0];
            const y = touch.clientY - rect.top;
            const half = rect.height / 2;

            const key = zone.dataset.color;

            if (y < half) {
                changeValue(key, 1);
                return;
            }

            changeValue(key, -1);
        });

    });
}

/**
 * 判定処理
 * @returns {void}
 */
function checkResult() {
    const current = { r: state.r, g: state.g, b: state.b };
    const diff = calculateDifference(state.target, current);
    const score = calculateScore(diff);
    const rank = evaluateRank(diff);

    document.getElementById("score").textContent = "Score: " + score;
    document.getElementById("rank").textContent = rank;
    document.getElementById("info").textContent = "差: " + Math.floor(diff);

    state.target = generateColor();
    updateUI();
}

/**
 * ジェスチャー完全無効化
 * @returns {void}
 */
function disableGesture() {

    document.addEventListener("touchmove", e => {
        e.preventDefault();
    }, { passive: false });

    document.addEventListener("gesturestart", e => {
        e.preventDefault();
    });

    let lastTouchEnd = 0;

    document.addEventListener("touchend", e => {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            e.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
}

/**
 * 初期化
 * @returns {void}
 */
function initialize() {
    state.target = generateColor();
    updateUI();
}

/* 初期処理 */
disableGesture();
setupInput();
initialize();

document.getElementById("check").addEventListener("click", checkResult);
