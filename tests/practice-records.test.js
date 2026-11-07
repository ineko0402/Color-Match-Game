"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const PracticeRecords = require("../practice-records.js");

function record(overrides = {}){
    return {
        firstDeltaE: 18,
        bestDeltaE: 4,
        finalDeltaE: 6,
        checks: 3,
        difficulty: "beginner",
        target: { r: 120, g: 80, b: 200 },
        firstPlayer: { r: 90, g: 70, b: 150 },
        bestPlayer: { r: 116, g: 82, b: 194 },
        finalPlayer: { r: 112, g: 84, b: 190 },
        recordedAt: 1_700_000_000_000,
        ...overrides
    };
}

test("old clear-based progress is not mixed into practice v2", () => {
    const progress = PracticeRecords.sanitizeProgress({
        completed: 10,
        streak: 3,
        history: [{ deltaE: 2, cleared: true }]
    });

    assert.deepEqual(progress, PracticeRecords.emptyProgress());
});

test("a practice record keeps the colors needed for weakness analysis", () => {
    const progress = PracticeRecords.addRecord(PracticeRecords.emptyProgress(), record());

    assert.equal(progress.practiceCount, 1);
    assert.equal(progress.totalImprovement, 14);
    assert.equal(progress.history[0].firstDeltaE, 18);
    assert.deepEqual(progress.history[0].target, { r: 120, g: 80, b: 200 });
    assert.deepEqual(progress.history[0].firstPlayer, { r: 90, g: 70, b: 150 });
    assert.deepEqual(progress.history[0].bestPlayer, { r: 116, g: 82, b: 194 });
    assert.deepEqual(progress.history[0].finalPlayer, { r: 112, g: 84, b: 190 });
});

test("history keeps the newest 100 valid practices", () => {
    let progress = PracticeRecords.emptyProgress();
    for(let i = 0; i < 105; i += 1){
        progress = PracticeRecords.addRecord(progress, record({ recordedAt: i }));
    }

    assert.equal(progress.practiceCount, 105);
    assert.equal(progress.history.length, 100);
    assert.equal(progress.history[0].recordedAt, 104);
    assert.equal(progress.history.at(-1).recordedAt, 5);
});

test("invalid RGB data is rejected", () => {
    assert.throws(
        () => PracticeRecords.createRecord(record({ target: { r: 300, g: 0, b: 0 } })),
        /Invalid practice record/
    );
});
