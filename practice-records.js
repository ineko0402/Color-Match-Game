(function(root, factory){
    const api = factory();

    if(typeof module === "object" && module.exports){
        module.exports = api;
        return;
    }

    root.PracticeRecords = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function(){
    "use strict";

    const VERSION = 2;
    const MAX_HISTORY = 100;
    const DIFFICULTIES = ["beginner", "intermediate", "advanced"];

    function emptyProgress(){
        return {
            version: VERSION,
            practiceCount: 0,
            totalImprovement: 0,
            history: []
        };
    }

    function isValidRgb(color){
        return color && ["r", "g", "b"].every(channel =>
            Number.isInteger(color[channel]) && color[channel] >= 0 && color[channel] <= 255
        );
    }

    function isValidRecord(item){
        return item &&
            Number.isFinite(item.firstDeltaE) && item.firstDeltaE >= 0 &&
            Number.isFinite(item.bestDeltaE) && item.bestDeltaE >= 0 &&
            Number.isFinite(item.finalDeltaE) && item.finalDeltaE >= 0 &&
            Number.isInteger(item.checks) && item.checks >= 0 &&
            DIFFICULTIES.includes(item.difficulty) &&
            isValidRgb(item.target) &&
            isValidRgb(item.firstPlayer) &&
            isValidRgb(item.bestPlayer) &&
            isValidRgb(item.finalPlayer) &&
            Number.isFinite(item.recordedAt);
    }

    function cloneRecord(item){
        return {
            firstDeltaE: item.firstDeltaE,
            bestDeltaE: item.bestDeltaE,
            finalDeltaE: item.finalDeltaE,
            checks: item.checks,
            difficulty: item.difficulty,
            target: { ...item.target },
            firstPlayer: { ...item.firstPlayer },
            bestPlayer: { ...item.bestPlayer },
            finalPlayer: { ...item.finalPlayer },
            recordedAt: item.recordedAt
        };
    }

    function sanitizeProgress(saved){
        const progress = emptyProgress();
        if(!saved || saved.version !== VERSION || typeof saved !== "object") return progress;

        progress.practiceCount = Number.isInteger(saved.practiceCount) && saved.practiceCount >= 0
            ? saved.practiceCount
            : 0;
        progress.totalImprovement = Number.isFinite(saved.totalImprovement) && saved.totalImprovement >= 0
            ? saved.totalImprovement
            : 0;
        progress.history = Array.isArray(saved.history)
            ? saved.history.filter(isValidRecord).slice(0, MAX_HISTORY).map(cloneRecord)
            : [];
        return progress;
    }

    function createRecord(values){
        const record = cloneRecord(values);
        if(!isValidRecord(record)) throw new TypeError("Invalid practice record");
        return record;
    }

    function addRecord(progress, record){
        const safeProgress = sanitizeProgress(progress);
        const safeRecord = createRecord(record);
        const improvement = Math.max(0, safeRecord.firstDeltaE - safeRecord.bestDeltaE);

        return {
            version: VERSION,
            practiceCount: safeProgress.practiceCount + 1,
            totalImprovement: safeProgress.totalImprovement + improvement,
            history: [safeRecord, ...safeProgress.history].slice(0, MAX_HISTORY)
        };
    }

    return {
        VERSION,
        MAX_HISTORY,
        DIFFICULTIES,
        emptyProgress,
        isValidRgb,
        sanitizeProgress,
        createRecord,
        addRecord
    };
});
