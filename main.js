"use strict";

const state = {
    r: 0,
    g: 0,
    b: 0,
    target: null,
    currentRank: "-",
    resultOpen: false
};

function generateColor() {
    return {
        r: Math.floor(Math.random()*256),
        g: Math.floor(Math.random()*256),
        b: Math.floor(Math.random()*256)
    };
}

function diff(a,b){
    return Math.sqrt(
        (a.r-b.r)**2 +
        (a.g-b.g)**2 +
        (a.b-b.b)**2
    );
}

function score(d){
    return Math.max(0, Math.floor(100 - d));
}

function rank(d){
    if(d<=10)return"S";
    if(d<=25)return"A";
    if(d<=50)return"B";
    if(d<=80)return"C";
    return"D";
}

function css(c){
    return `rgb(${c.r},${c.g},${c.b})`;
}

/* ランク色クラスを設定 */
function applyRankClass(el, r){
    el.classList.remove("rank-S","rank-A","rank-B","rank-C","rank-D");
    if(r !== "-") el.classList.add("rank-"+r);
}

/* ランク変更エフェクト（イベント駆動） */
function checkRankChange(){
    const cur = {r:state.r, g:state.g, b:state.b};
    const d = diff(state.target, cur);
    const newRank = rank(d);

    const rankEl = document.getElementById("rank");

    if(newRank !== state.currentRank){
        state.currentRank = newRank;
        rankEl.textContent = newRank;
        applyRankClass(rankEl, newRank);

        // popアニメーション再トリガー
        rankEl.classList.remove("pop");
        void rankEl.offsetWidth; // reflow強制
        rankEl.classList.add("pop");
    }
}

function update(){
    const cur = {r:state.r,g:state.g,b:state.b};

    document.getElementById("resultColor").style.background = css(cur);
    document.getElementById("target").style.background = css(state.target);

    document.getElementById("rVal").textContent = state.r;
    document.getElementById("gVal").textContent = state.g;
    document.getElementById("bVal").textContent = state.b;

    document.getElementById("rFill").style.height = state.r/255*100+"%";
    document.getElementById("gFill").style.height = state.g/255*100+"%";
    document.getElementById("bFill").style.height = state.b/255*100+"%";

    // ランクをリアルタイム判定（change時のみ呼ばれるので軽量）
    checkRankChange();
}

function change(k,d){
    const n = state[k] + d;
    state[k] = Math.max(0,Math.min(255,n));
    update();
}

/* RGB一括増減 */
function batchChange(d){
    state.r = Math.max(0, Math.min(255, state.r + d));
    state.g = Math.max(0, Math.min(255, state.g + d));
    state.b = Math.max(0, Math.min(255, state.b + d));
    update();
}

/* タッチ入力 */
function input(){
    document.querySelectorAll(".zone").forEach(z=>{

        let start=0;
        let moved=false;

        z.addEventListener("touchstart",e=>{
            e.preventDefault();
            start=e.touches[0].clientY;
            moved=false;
        },{passive:false});

        z.addEventListener("touchmove",e=>{
            e.preventDefault();
            const y=e.touches[0].clientY;
            const diff=start-y;
            const k=z.dataset.color;

            const d=Math.floor(diff/8);

            if(d!==0){
                change(k,d);
                start=y;
                moved=true;
            }
        },{passive:false});

        z.addEventListener("touchend",e=>{
            if(moved)return;

            const rect=z.getBoundingClientRect();
            const y=e.changedTouches[0].clientY-rect.top;
            const k=z.dataset.color;

            if(y<rect.height/2){
                change(k,1);
                return;
            }
            change(k,-1);
        });
    });
}

/* マウスクリック入力（PC対応） */
function mouseInput(){
    document.querySelectorAll(".zone").forEach(z=>{
        z.addEventListener("click",e=>{
            const rect=z.getBoundingClientRect();
            const y=e.clientY-rect.top;
            const k=z.dataset.color;

            if(y<rect.height/2){
                change(k,1);
            } else {
                change(k,-1);
            }
        });
    });
}

/* キーボード入力 */
function keyInput(){
    const KEY_STEP = 5;

    document.addEventListener("keydown",e=>{
        // リザルト画面中はEnter/Spaceのみ受付
        if(state.resultOpen){
            if(e.code==="Enter" || e.code==="Space"){
                e.preventDefault();
                nextRound();
            }
            return;
        }

        switch(e.code){
            // RGB増加: A S D
            case "KeyA": change("r", KEY_STEP); break;
            case "KeyS": change("g", KEY_STEP); break;
            case "KeyD": change("b", KEY_STEP); break;

            // RGB減少: Z X C
            case "KeyZ": change("r", -KEY_STEP); break;
            case "KeyX": change("g", -KEY_STEP); break;
            case "KeyC": change("b", -KEY_STEP); break;

            // マッチ: Space / Enter
            case "Space":
            case "Enter":
                e.preventDefault();
                check();
                break;
        }
    });
}

/* ========== リザルト画面 ========== */
function showResult(){
    const cur = {r:state.r, g:state.g, b:state.b};
    const d = diff(state.target, cur);
    const s = score(d);
    const r = rank(d);

    // リザルト内容セット
    const resultRankEl = document.getElementById("result-rank");
    resultRankEl.textContent = r;
    resultRankEl.className = "result-rank";
    applyRankClass(resultRankEl, r);

    document.getElementById("result-score").textContent = s;
    document.getElementById("result-diff").textContent = Math.floor(d);
    document.getElementById("result-target").style.background = css(state.target);
    document.getElementById("result-player").style.background = css(cur);

    // オーバーレイ表示（アニメーション再トリガー）
    const overlay = document.getElementById("result-overlay");
    overlay.classList.remove("hidden");
    state.resultOpen = true;

    // アニメーション再発火のためにノードを再挿入
    const card = overlay.querySelector(".result-card");
    const clone = card.cloneNode(true);
    card.parentNode.replaceChild(clone, card);

    // 新しいNEXTボタンにイベント再バインド
    clone.querySelector("#next-btn").addEventListener("click", nextRound);
}

function nextRound(){
    // オーバーレイ非表示
    document.getElementById("result-overlay").classList.add("hidden");
    state.resultOpen = false;

    // RGB値を0にリセット
    state.r = 0;
    state.g = 0;
    state.b = 0;
    state.currentRank = "-";

    const rankEl = document.getElementById("rank");
    rankEl.textContent = "-";
    rankEl.className = "rank";

    // 新しいターゲット
    state.target = generateColor();
    update();
}

function check(){
    showResult();
}

function disableGesture(){
    document.addEventListener("touchmove",e=>e.preventDefault(),{passive:false});
    document.addEventListener("gesturestart",e=>e.preventDefault());

    let last=0;
    document.addEventListener("touchend",e=>{
        const now=Date.now();
        if(now-last<=300)e.preventDefault();
        last=now;
    });
}

function init(){
    state.r = 0;
    state.g = 0;
    state.b = 0;
    state.currentRank = "-";
    state.target = generateColor();
    update();
}

disableGesture();
input();
mouseInput();
keyInput();
init();

document.getElementById("check").addEventListener("click", check);
document.getElementById("next-btn").addEventListener("click", nextRound);
document.getElementById("batchDown").addEventListener("click", ()=> batchChange(-10));
document.getElementById("batchUp").addEventListener("click", ()=> batchChange(10));