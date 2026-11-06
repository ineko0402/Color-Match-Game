"use strict";

const SETTINGS_KEY = "color-match-settings-v1";
const PROGRESS_KEY = "color-match-progress-v1";
const DIFFICULTIES = ["beginner", "intermediate", "advanced"];

const state = {
    r: 0,
    g: 0,
    b: 0,
    target: null,
    checks: 0,
    feedbackShown: false,
    resultOpen: false,
    cleared: false,
    answerRecorded: false,
    difficulty: "beginner",
    progress: null
};

function emptyProgress(){
    return {
        completed: 0,
        rounds: 0,
        streak: 0,
        bestDeltaE: null,
        history: []
    };
}

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
    const saved = readJson(PROGRESS_KEY);
    const progress = emptyProgress();

    if(!saved || typeof saved !== "object") return progress;

    progress.completed = Number.isInteger(saved.completed) && saved.completed >= 0 ? saved.completed : 0;
    progress.rounds = Number.isInteger(saved.rounds) && saved.rounds >= 0 ? saved.rounds : 0;
    progress.streak = Number.isInteger(saved.streak) && saved.streak >= 0 ? saved.streak : 0;
    progress.bestDeltaE = Number.isFinite(saved.bestDeltaE) && saved.bestDeltaE >= 0
        ? saved.bestDeltaE
        : null;
    progress.history = Array.isArray(saved.history)
        ? saved.history
            .filter(item =>
                item &&
                Number.isFinite(item.deltaE) &&
                Number.isInteger(item.checks) &&
                typeof item.cleared === "boolean" &&
                DIFFICULTIES.includes(item.difficulty)
            )
            .slice(0, 5)
            .map(item => ({
                deltaE: Math.max(0, item.deltaE),
                checks: Math.max(0, item.checks),
                cleared: item.cleared,
                difficulty: item.difficulty
            }))
        : [];

    return progress;
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
    document.getElementById("streak").textContent = state.progress.streak;
    document.getElementById("completed-count").textContent = `${state.progress.completed}クリア`;

    const list = document.getElementById("history-list");
    list.replaceChildren();

    if(state.progress.history.length === 0){
        const empty = document.createElement("li");
        empty.className = "empty-history";
        empty.textContent = "まだ記録がありません";
        list.append(empty);
        return;
    }

    state.progress.history.forEach(item => {
        const row = document.createElement("li");
        const result = document.createElement("strong");
        const detail = document.createElement("span");

        result.textContent = item.cleared ? "クリア" : "練習終了";
        detail.textContent = `${difficultyLabel(item.difficulty)}・ΔE00 ${item.deltaE.toFixed(1)}・照合${item.checks}回`;
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
    state.feedbackShown = true;

    document.getElementById("closeness").textContent = closenessLabel(comparison.deltaE);
    document.getElementById("delta-e").textContent = `知覚的な色差 ΔE00: ${comparison.deltaE.toFixed(1)}`;
    document.getElementById("brightness").textContent = brightnessLabel(comparison.lightnessDifference);
    document.getElementById("rHint").textContent = channelHint(state.target.r, state.r);
    document.getElementById("gHint").textContent = channelHint(state.target.g, state.g);
    document.getElementById("bHint").textContent = channelHint(state.target.b, state.b);
    document.getElementById("feedback-note").textContent = comparison.deltaE <= 3
        ? "クリア！答え合わせでRGB値を振り返ってみよう。"
        : "ヒントを参考に調整して、もう一度照合してみよう。";

    if(comparison.deltaE <= 3 && !state.cleared){
        state.cleared = true;
        state.progress.completed += 1;
        state.progress.streak += 1;
        persistProgress();
        renderProgress();
    }

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

    document.getElementById("result-checks").textContent = state.checks;
    document.getElementById("result-delta-e").textContent = comparison.deltaE.toFixed(1);
    document.getElementById("result-target").style.background = css(state.target);
    document.getElementById("result-player").style.background = css(cur);
    document.getElementById("target-rgb").textContent = `RGB(${state.target.r}, ${state.target.g}, ${state.target.b})`;
    document.getElementById("player-rgb").textContent = `RGB(${cur.r}, ${cur.g}, ${cur.b})`;

    if(!state.answerRecorded){
        state.progress.rounds += 1;
        if(!state.cleared) state.progress.streak = 0;
        state.progress.bestDeltaE = state.progress.bestDeltaE === null
            ? comparison.deltaE
            : Math.min(state.progress.bestDeltaE, comparison.deltaE);
        state.progress.history.unshift({
            deltaE: comparison.deltaE,
            checks: state.checks,
            cleared: state.cleared,
            difficulty: state.difficulty
        });
        state.progress.history = state.progress.history.slice(0, 5);
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
    state.feedbackShown = false;
    state.resultOpen = false;
    state.cleared = false;
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
    if(!window.confirm("連続クリアと最近の記録をすべて消しますか？")) return;
    state.progress = emptyProgress();
    persistProgress();
    renderProgress();
    helpDialog.close();
});
