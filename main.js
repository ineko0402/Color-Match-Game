"use strict";

/** @typedef {{r:number,g:number,b:number}} Color */

const state = {
    r: 128,
    g: 128,
    b: 128,
    target: null
};

/**
 * ランダム色
 * @returns {Color}
 */
function generateColor() {
    return {
        r: Math.floor(Math.random()*256),
        g: Math.floor(Math.random()*256),
        b: Math.floor(Math.random()*256)
    };
}

/**
 * 色差
 * @param {Color} a
 * @param {Color} b
 * @returns {number}
 */
function diffColor(a, b) {
    const dr = a.r - b.r;
    const dg = a.g - b.g;
    const db = a.b - b.b;
    return Math.sqrt(dr*dr + dg*dg + db*db);
}

/**
 * スコア
 * @param {number} diff
 * @returns {number}
 */
function calcScore(diff) {
    return Math.max(0, Math.floor(100 - diff));
}

/**
 * ランク
 * @param {number} diff
 * @returns {string}
 */
function rank(diff) {
    if (diff <= 10) return "S";
    if (diff <= 25) return "A";
    if (diff <= 50) return "B";
    if (diff <= 80) return "C";
    return "D";
}

/**
 * CSS変換
 * @param {Color} c
 * @returns {string}
 */
function toCss(c) {
    return `rgb(${c.r},${c.g},${c.b})`;
}

/**
 * UI更新
 */
function updateUI() {
    const current = { r: state.r, g: state.g, b: state.b };

    document.getElementById("resultColor").style.background = toCss(current);
    document.getElementById("target").style.background = toCss(state.target);

    document.getElementById("rVal").textContent = state.r;
    document.getElementById("gVal").textContent = state.g;
    document.getElementById("bVal").textContent = state.b;

    // 背景連動
    document.querySelector(".r").style.background = `rgba(${state.r},0,0,0.4)`;
    document.querySelector(".g").style.background = `rgba(0,${state.g},0,0.4)`;
    document.querySelector(".b").style.background = `rgba(0,0,${state.b},0.4)`;
}

/**
 * 値変更
 * @param {"r"|"g"|"b"} key
 * @param {number} delta
 */
function change(key, delta) {
    const next = state[key] + delta;
    state[key] = Math.max(0, Math.min(255, next));
    updateUI();
}

/**
 * 入力設定
 */
function setupInput() {
    document.querySelectorAll(".zone").forEach(zone => {

        let startY = 0;
        let moved = false;

        zone.addEventListener("touchstart", e => {
            startY = e.touches[0].clientY;
            moved = false;
        });

        zone.addEventListener("touchmove", e => {
            const y = e.touches[0].clientY;
            const diff = startY - y;
            const key = zone.dataset.color;

            const delta = Math.floor(diff / 8);

            if (delta !== 0) {
                change(key, delta);
                startY = y;
                moved = true;
            }
        });

        zone.addEventListener("touchend", e => {
            if (moved) return;

            const rect = zone.getBoundingClientRect();
            const y = e.changedTouches[0].clientY - rect.top;
            const key = zone.dataset.color;

            if (y < rect.height / 2) {
                change(key, 1);
                return;
            }

            change(key, -1);
        });

    });
}

/**
 * 判定
 */
function check() {
    const current = { r: state.r, g: state.g, b: state.b };
    const diff = diffColor(state.target, current);
    const score = calcScore(diff);

    document.getElementById("score").textContent = "Score: " + score;
    document.getElementById("rank").textContent = rank(diff);
    document.getElementById("info").textContent = "差：" + Math.floor(diff);

    state.target = generateColor();
    updateUI();
}

/**
 * 初期化
 */
function init() {
    state.target = generateColor();
    updateUI();
}

document.getElementById("check").addEventListener("click", check);

setupInput();
init();
