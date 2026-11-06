"use strict";

const state = {
    r: 0,
    g: 0,
    b: 0,
    target: null,
    checks: 0,
    feedbackShown: false,
    resultOpen: false
};

function generateColor(){
    return {
        r: Math.floor(Math.random() * 256),
        g: Math.floor(Math.random() * 256),
        b: Math.floor(Math.random() * 256)
    };
}

function rgbDistance(a, b){
    return Math.sqrt(
        (a.r - b.r) ** 2 +
        (a.g - b.g) ** 2 +
        (a.b - b.b) ** 2
    );
}

function luminance(c){
    return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
}

function css(c){
    return `rgb(${c.r},${c.g},${c.b})`;
}

function currentColor(){
    return { r: state.r, g: state.g, b: state.b };
}

function update(){
    const cur = currentColor();

    document.getElementById("resultColor").style.background = css(cur);
    document.getElementById("target").style.background = css(state.target);

    ["r", "g", "b"].forEach(k => {
        document.getElementById(`${k}Val`).textContent = state[k];
        document.getElementById(`${k}Fill`).style.height = `${state[k] / 255 * 100}%`;
        document.querySelector(`[data-color="${k}"]`).setAttribute("aria-valuenow", state[k]);
    });
}

function markFeedbackStale(){
    if(!state.feedbackShown) return;
    document.getElementById("feedback").classList.add("stale");
    document.getElementById("feedback-note").textContent = "調整後の状態を確認するには、もう一度照合してください。";
}

function change(k, d){
    state[k] = Math.max(0, Math.min(255, state[k] + d));
    update();
    markFeedbackStale();
}

function batchChange(d){
    ["r", "g", "b"].forEach(k => {
        state[k] = Math.max(0, Math.min(255, state[k] + d));
    });
    update();
    markFeedbackStale();
}

function closenessLabel(distance){
    if(distance <= 10) return "ほぼ同じ色です";
    if(distance <= 25) return "かなり近づきました";
    if(distance <= 50) return "少し違いがあります";
    if(distance <= 80) return "まだ違いがあります";
    return "かなり離れています";
}

function brightnessLabel(target, current){
    const difference = luminance(target) - luminance(current);
    if(Math.abs(difference) <= 5) return "明るさはほぼ合っています";
    if(difference > 20) return "現在の色はかなり暗めです";
    if(difference > 0) return "現在の色は少し暗めです";
    if(difference < -20) return "現在の色はかなり明るめです";
    return "現在の色は少し明るめです";
}

function channelHint(targetValue, currentValue){
    const difference = targetValue - currentValue;
    const amount = Math.abs(difference);

    if(amount <= 3) return "✓ ほぼ合っています";

    const direction = difference > 0 ? "増やす" : "減らす";
    const arrow = difference > 0 ? "↑" : "↓";
    if(amount <= 15) return `${arrow} 少し${direction}`;
    if(amount <= 40) return `${arrow} ${direction}`;
    return `${arrow} 大きく${direction}`;
}

function check(){
    const cur = currentColor();
    const distance = rgbDistance(state.target, cur);

    state.checks += 1;
    state.feedbackShown = true;

    document.getElementById("closeness").textContent = closenessLabel(distance);
    document.getElementById("brightness").textContent = brightnessLabel(state.target, cur);
    document.getElementById("rHint").textContent = channelHint(state.target.r, state.r);
    document.getElementById("gHint").textContent = channelHint(state.target.g, state.g);
    document.getElementById("bHint").textContent = channelHint(state.target.b, state.b);
    document.getElementById("feedback-note").textContent = "ヒントを参考に調整して、もう一度照合してみよう。";

    const feedback = document.getElementById("feedback");
    feedback.classList.remove("hidden", "stale");
    feedback.scrollIntoView({ behavior: "auto", block: "nearest" });
}

function resetMix(){
    state.r = 0;
    state.g = 0;
    state.b = 0;
    update();
    markFeedbackStale();
}

function showAnswer(){
    const cur = currentColor();

    document.getElementById("result-checks").textContent = state.checks;
    document.getElementById("result-target").style.background = css(state.target);
    document.getElementById("result-player").style.background = css(cur);
    document.getElementById("target-rgb").textContent = `RGB(${state.target.r}, ${state.target.g}, ${state.target.b})`;
    document.getElementById("player-rgb").textContent = `RGB(${cur.r}, ${cur.g}, ${cur.b})`;

    document.getElementById("result-overlay").classList.remove("hidden");
    state.resultOpen = true;
    document.getElementById("next-btn").focus();
}

function nextRound(){
    document.getElementById("result-overlay").classList.add("hidden");
    document.getElementById("feedback").classList.add("hidden");

    state.r = 0;
    state.g = 0;
    state.b = 0;
    state.checks = 0;
    state.feedbackShown = false;
    state.resultOpen = false;
    state.target = generateColor();

    update();
    document.getElementById("check").focus();
}

function input(){
    document.querySelectorAll(".zone").forEach(z => {
        let start = 0;
        let moved = false;

        z.addEventListener("touchstart", e => {
            e.preventDefault();
            start = e.touches[0].clientY;
            moved = false;
        }, { passive: false });

        z.addEventListener("touchmove", e => {
            e.preventDefault();
            const y = e.touches[0].clientY;
            const amount = Math.floor((start - y) / 8);

            if(amount !== 0){
                change(z.dataset.color, amount);
                start = y;
                moved = true;
            }
        }, { passive: false });

        z.addEventListener("touchend", e => {
            if(moved) return;
            const rect = z.getBoundingClientRect();
            const y = e.changedTouches[0].clientY - rect.top;
            change(z.dataset.color, y < rect.height / 2 ? 1 : -1);
        });

        z.addEventListener("click", e => {
            const rect = z.getBoundingClientRect();
            const y = e.clientY - rect.top;
            change(z.dataset.color, y < rect.height / 2 ? 1 : -1);
        });

        z.addEventListener("keydown", e => {
            if(e.code === "ArrowUp" || e.code === "ArrowRight"){
                e.preventDefault();
                change(z.dataset.color, 1);
            }
            if(e.code === "ArrowDown" || e.code === "ArrowLeft"){
                e.preventDefault();
                change(z.dataset.color, -1);
            }
        });
    });
}

function keyInput(){
    const keyStep = 5;

    document.addEventListener("keydown", e => {
        if(state.resultOpen){
            if(e.code === "Enter" || e.code === "Space"){
                e.preventDefault();
                nextRound();
            }
            return;
        }

        if(e.target.closest("button")) return;

        const actions = {
            KeyA: () => change("r", keyStep),
            KeyZ: () => change("r", -keyStep),
            KeyS: () => change("g", keyStep),
            KeyX: () => change("g", -keyStep),
            KeyD: () => change("b", keyStep),
            KeyC: () => change("b", -keyStep)
        };

        if(actions[e.code]) actions[e.code]();
        if(e.code === "Space"){
            e.preventDefault();
            check();
        }
    });
}

function init(){
    state.target = generateColor();
    update();
}

input();
keyInput();
init();

document.getElementById("check").addEventListener("click", check);
document.getElementById("reset").addEventListener("click", resetMix);
document.getElementById("reveal").addEventListener("click", showAnswer);
document.getElementById("next-btn").addEventListener("click", nextRound);
document.getElementById("batchDown").addEventListener("click", () => batchChange(-10));
document.getElementById("batchUp").addEventListener("click", () => batchChange(10));
