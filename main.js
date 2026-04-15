"use strict";

const state = {
    r: 128,
    g: 128,
    b: 128,
    target: null
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
}

function change(k,d){
    const n = state[k] + d;
    state[k] = Math.max(0,Math.min(255,n));
    update();
}

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

function check(){
    const cur={r:state.r,g:state.g,b:state.b};
    const d=diff(state.target,cur);

    document.getElementById("score").textContent=score(d);
    document.getElementById("rank").textContent=rank(d);
    document.getElementById("info").textContent="差:"+Math.floor(d);

    state.target=generateColor();
    update();
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
    state.target=generateColor();
    update();
}

disableGesture();
input();
init();

document.getElementById("check").addEventListener("click",check);