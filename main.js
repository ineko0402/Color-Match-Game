"use strict";

const SETTINGS_KEY = "color-match-settings-v1";
const PROGRESS_KEY = "color-match-practice-v2";
const DIFFICULTIES = PracticeRecords.DIFFICULTIES;

const state = {
    r: 0,
    g: 0,
    b: 0,
    target: null,
    checks: 0,
    firstDeltaE: null,
    bestDeltaE: null,
    firstColor: null,
    bestColor: null,
    feedbackShown: false,
    resultOpen: false,
    answerRecorded: false,
    difficulty: "beginner",
    progress: null
};

function readJson(key){
    try {
        return JSON.parse(localStorage.getItem(key));
    } catch {
        return null;
    }
}

function loadSettings(){
    const settings = readJson(SETTINGS_KEY);
    return DIFFICULTIES.includes(settings?.difficulty)
        ? settings.difficulty
        : "beginner";
}

function loadProgress(){
    return PracticeRecords.sanitizeProgress(readJson(PROGRESS_KEY));
}

function persistProgress(){
    try {
        localStorage.setItem(PROGRESS_KEY, JSON.stringify(state.progress));
    } catch {
        // 保存できない環境でもゲームは継続する
    }
}

function difficultyLabel(value){
    return {
        beginner: "初級",
        intermediate: "中級",
        advanced: "上級"
    }[value];
}

function renderProgress(){
    document.getElementById("practice-count").textContent = state.progress.practiceCount;
    const averageImprovement = state.progress.practiceCount === 0
        ? 0
        : state.progress.totalImprovement / state.progress.practiceCount;
    document.getElementById("average-improvement").textContent = `平均改善 ${averageImprovement.toFixed(1)}`;

    const list = document.getElementById("history-list");
    list.replaceChildren();

    if(state.progress.history.length === 0){
        const empty = document.createElement("li");
        empty.className = "empty-history";
        empty.textContent = "まだ記録がありません";
        list.append(empty);
        return;
    }

    state.progress.history.slice(0, 5).forEach(item => {
        const row = document.createElement("li");
        const result = document.createElement("strong");
        const detail = document.createElement("span");

        const improvement = Math.max(0, item.firstDeltaE - item.bestDeltaE);
        result.textContent = `改善 ${improvement.toFixed(1)}`;
        detail.textContent = `${difficultyLabel(item.difficulty)}・${item.firstDeltaE.toFixed(1)} → ${item.bestDeltaE.toFixed(1)}・照合${item.checks}回`;
        row.append(result, detail);
        list.append(row);
    });
}

function applyDifficulty(value){
    state.difficulty = DIFFICULTIES.includes(value) ? value : "beginner";
    document.body.dataset.difficulty = state.difficulty;
    document.getElementById("difficulty").value = state.difficulty;

    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify({ difficulty: state.difficulty }));
    } catch {
        // 保存できない環境でも選択中の難易度は維持する
    }
}

function generateColor(){
    return {
        r: Math.floor(Math.random() * 256),
        g: Math.floor(Math.random() * 256),
        b: Math.floor(Math.random() * 256)
    };
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

function closenessLabel(deltaE){
    if(deltaE <= 1) return "ほぼ同じ色です";
    if(deltaE <= 3) return "かなり近づきました";
    if(deltaE <= 6) return "少し違いがあります";
    if(deltaE <= 12) return "まだ違いがあります";
    return "かなり離れています";
}

function brightnessLabel(lightnessDifference){
    if(Math.abs(lightnessDifference) <= 1) return "明るさはほぼ合っています";
    if(lightnessDifference > 5) return "現在の色はかなり暗めです";
    if(lightnessDifference > 0) return "現在の色は少し暗めです";
    if(lightnessDifference < -5) return "現在の色はかなり明るめです";
    return "現在の色は少し明るめです";
}

function channelHint(targetValue, currentValue){
    const difference = targetValue - currentValue;
    const amount = Math.abs(difference);

    if(amount <= 3) return "✓ ほぼ合っています";

    const direction = difference > 0 ? "増やす" : "減らす";
    const arrow = difference > 0 ? "↑" : "↓";
    if(state.difficulty === "intermediate") return `${arrow} ${direction}`;
    if(amount <= 15) return `${arrow} 少し${direction}`;
    if(amount <= 40) return `${arrow} ${direction}`;
    return `${arrow} 大きく${direction}`;
}

function check(){
    const cur = currentColor();
    const comparison = ColorScience.compareRgb(state.target, cur);

    state.checks += 1;
    if(state.firstDeltaE === null){
        state.firstDeltaE = comparison.deltaE;
        state.firstColor = { ...cur };
    }
    if(state.bestDeltaE === null || comparison.deltaE < state.bestDeltaE){
        state.bestDeltaE = comparison.deltaE;
        state.bestColor = { ...cur };
    }
    state.feedbackShown = true;

    document.getElementById("closeness").textContent = closenessLabel(comparison.deltaE);
    document.getElementById("delta-e").textContent = `知覚的な色差 ΔE00: ${comparison.deltaE.toFixed(1)}`;
    document.getElementById("brightness").textContent = brightnessLabel(comparison.lightnessDifference);
    document.getElementById("rHint").textContent = channelHint(state.target.r, state.r);
    document.getElementById("gHint").textContent = channelHint(state.target.g, state.g);
    document.getElementById("bHint").textContent = channelHint(state.target.b, state.b);
    document.getElementById("feedback-note").textContent = comparison.deltaE <= 3
        ? "かなり近づきました。さらに調整しても、ここで振り返っても構いません。"
        : "ヒントを参考に調整して、もう一度照合してみよう。";

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
    const comparison = ColorScience.compareRgb(state.target, cur);
    const firstDeltaE = state.firstDeltaE ?? comparison.deltaE;
    const bestDeltaE = Math.min(state.bestDeltaE ?? comparison.deltaE, comparison.deltaE);
    const firstPlayer = state.firstColor ?? cur;
    const bestPlayer = comparison.deltaE <= (state.bestDeltaE ?? comparison.deltaE)
        ? cur
        : state.bestColor;
    const improvement = Math.max(0, firstDeltaE - bestDeltaE);

    document.getElementById("result-checks").textContent = state.checks;
    document.getElementById("result-first-delta-e").textContent = firstDeltaE.toFixed(1);
    document.getElementById("result-best-delta-e").textContent = bestDeltaE.toFixed(1);
    document.getElementById("result-final-delta-e").textContent = comparison.deltaE.toFixed(1);
    document.getElementById("result-improvement").textContent = improvement.toFixed(1);
    document.getElementById("result-target").style.background = css(state.target);
    document.getElementById("result-player").style.background = css(cur);
    document.getElementById("target-rgb").textContent = `RGB(${state.target.r}, ${state.target.g}, ${state.target.b})`;
    document.getElementById("player-rgb").textContent = `RGB(${cur.r}, ${cur.g}, ${cur.b})`;

    if(!state.answerRecorded){
        state.progress = PracticeRecords.addRecord(state.progress, {
            firstDeltaE,
            bestDeltaE,
            finalDeltaE: comparison.deltaE,
            checks: state.checks,
            difficulty: state.difficulty,
            target: { ...state.target },
            firstPlayer: { ...firstPlayer },
            bestPlayer: { ...bestPlayer },
            finalPlayer: { ...cur },
            recordedAt: Date.now()
        });
        state.answerRecorded = true;
        persistProgress();
        renderProgress();
    }

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
    state.firstDeltaE = null;
    state.bestDeltaE = null;
    state.firstColor = null;
    state.bestColor = null;
    state.feedbackShown = false;
    state.resultOpen = false;
    state.answerRecorded = false;
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
    state.difficulty = loadSettings();
    state.progress = loadProgress();
    state.target = generateColor();
    applyDifficulty(state.difficulty);
    renderProgress();
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
document.getElementById("difficulty").addEventListener("change", e => applyDifficulty(e.target.value));

const helpDialog = document.getElementById("help-dialog");
document.getElementById("help").addEventListener("click", () => helpDialog.showModal());
document.getElementById("close-help").addEventListener("click", () => helpDialog.close());
helpDialog.addEventListener("click", e => {
    if(e.target === helpDialog) helpDialog.close();
});

document.getElementById("reset-progress").addEventListener("click", () => {
    if(!window.confirm("練習回数と最近の記録をすべて消しますか？")) return;
    state.progress = PracticeRecords.emptyProgress();
    persistProgress();
    renderProgress();
    helpDialog.close();
});
