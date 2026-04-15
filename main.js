"use strict";

/** @typedef {{r:number,g:number,b:number}} Color */

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
 * @param {Color} target
 * @param {Color} current
 * @returns {number}
 */
function calculateDifference(target, current) {
    const diffR = target.r - current.r;
    const diffG = target.g - current.g;
    const diffB = target.b - current.b;
    return Math.sqrt(diffR*diffR + diffG*diffG + diffB*diffB);
}

/**
 * スコア計算
 * @param {number} diff
 * @returns {number}
 */
function calculateScore(diff) {
    const rawScore = 100 - diff;
    return Math.max(0, Math.floor(rawScore));
}

/**
 * 評価ランク
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
 * CSS色変換
 * @param {Color} color
 * @returns {string}
 */
function convertToCss(color) {
    return `rgb(${color.r},${color.g},${color.b})`;
}

const state = {
    difficulty: "easy",
    targetColor: generateColor(),
    attemptCount: 0,
    timeLeft: 15,
    timerId: null
};

/**
 * 現在色取得
 * @returns {Color}
 */
function getCurrentColor() {
    return {
        r: Number(document.getElementById("r").value),
        g: Number(document.getElementById("g").value),
        b: Number(document.getElementById("b").value)
    };
}

/**
 * UI更新
 */
function updateUI() {
    const current = getCurrentColor();

    document.getElementById("current").style.background = convertToCss(current);

    const isHard = state.difficulty === "hard";
    const targetVisible = !isHard || state.timeLeft > 12;

    document.getElementById("target").style.background =
        targetVisible ? convertToCss(state.targetColor) : "#000";
}

/**
 * 成功アニメーション
 */
function playSuccessAnimation() {
    const box = document.getElementById("current");
    box.classList.add("success");

    setTimeout(() => {
        box.classList.remove("success");
    }, 300);
}

/**
 * 初期化
 */
function initializeGame() {
    state.targetColor = generateColor();
    state.attemptCount = 0;
    state.timeLeft = 15;

    clearInterval(state.timerId);

    if (state.difficulty === "hard") {
        state.timerId = setInterval(() => {
            state.timeLeft -= 1;
            if (state.timeLeft <= 0) {
                clearInterval(state.timerId);
                document.getElementById("result").textContent = "時間切れ";
            }
            updateUI();
        }, 1000);
    }

    updateUI();
}

document.getElementById("difficulty").addEventListener("change", (event) => {
    state.difficulty = event.target.value;
    initializeGame();
});

document.getElementById("check").addEventListener("click", () => {
    const current = getCurrentColor();
    const diff = calculateDifference(state.targetColor, current);

    const score = calculateScore(diff);
    const rank = evaluateRank(diff);

    playSuccessAnimation();

    document.getElementById("result").textContent =
        `差:${Math.floor(diff)} / スコア:${score} / 評価:${rank}`;
});

document.querySelectorAll("input[type=range]").forEach(element => {
    element.addEventListener("input", updateUI);
});

initializeGame();
