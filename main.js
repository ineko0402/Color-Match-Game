"use strict";

/** @typedef {{r:number,g:number,b:number}} Color */

const state = {
    r: 128,
    g: 128,
    b: 128
};

/**
 * 色更新
 * @returns {void}
 */
function updateColor() {
    const color = `rgb(${state.r},${state.g},${state.b})`;
    document.getElementById("result").style.background = color;
}

/**
 * 値変更
 * @param {"r"|"g"|"b"} key
 * @param {number} delta
 * @returns {void}
 */
function changeValue(key, delta) {
    const current = state[key];
    const next = current + delta;
    const clamped = Math.max(0, Math.min(255, next));
    state[key] = clamped;
    updateColor();
}

/**
 * 入力処理を設定
 * @returns {void}
 */
function setupInput() {
    document.querySelectorAll(".zone").forEach(zone => {

        let startY = 0;
        let moved = false;

        zone.addEventListener("touchstart", event => {
            startY = event.touches[0].clientY;
            moved = false;
        });

        zone.addEventListener("touchmove", event => {
            const currentY = event.touches[0].clientY;
            const diff = startY - currentY;

            const key = zone.dataset.color;

            const delta = Math.floor(diff / 8);

            if (delta !== 0) {
                changeValue(key, delta);
                startY = currentY;
                moved = true;
            }
        });

        zone.addEventListener("touchend", event => {
            if (moved === true) {
                return;
            }

            const rect = zone.getBoundingClientRect();
            const touch = event.changedTouches[0];
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

updateColor();
setupInput();
