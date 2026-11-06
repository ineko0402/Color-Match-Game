"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
    rgbToLab,
    deltaE2000,
    compareRgb
} = require("../color-science.js");

function closeTo(actual, expected, tolerance = 0.0001){
    assert.ok(
        Math.abs(actual - expected) <= tolerance,
        `expected ${actual} to be within ${tolerance} of ${expected}`
    );
}

test("sRGB reference colors convert to CIELAB D65", () => {
    const black = rgbToLab({ r: 0, g: 0, b: 0 });
    const white = rgbToLab({ r: 255, g: 255, b: 255 });
    const red = rgbToLab({ r: 255, g: 0, b: 0 });

    closeTo(black.l, 0);
    closeTo(white.l, 100, 0.0001);
    closeTo(white.a, 0, 0.001);
    closeTo(white.b, 0, 0.001);
    closeTo(red.l, 53.2408, 0.001);
    closeTo(red.a, 80.0925, 0.001);
    closeTo(red.b, 67.2032, 0.001);
});

test("CIEDE2000 matches Sharma reference pairs", () => {
    const pairs = [
        [{ l: 50, a: 2.6772, b: -79.7751 }, { l: 50, a: 0, b: -82.7485 }, 2.0425],
        [{ l: 50, a: 3.1571, b: -77.2803 }, { l: 50, a: 0, b: -82.7485 }, 2.8615],
        [{ l: 50, a: 2.8361, b: -74.0200 }, { l: 50, a: 0, b: -82.7485 }, 3.4412],
        [{ l: 50, a: -1.3802, b: -84.2814 }, { l: 50, a: 0, b: -82.7485 }, 1.0000],
        [{ l: 50, a: -1.1848, b: -84.8006 }, { l: 50, a: 0, b: -82.7485 }, 1.0000],
        [{ l: 50, a: -0.9009, b: -85.5211 }, { l: 50, a: 0, b: -82.7485 }, 1.0000],
        [{ l: 50, a: 0, b: 0 }, { l: 50, a: -1, b: 2 }, 2.3669]
    ];

    pairs.forEach(([first, second, expected]) => {
        closeTo(deltaE2000(first, second), expected);
        closeTo(deltaE2000(second, first), expected);
    });
});

test("identical RGB colors have zero perceptual difference", () => {
    const result = compareRgb(
        { r: 42, g: 128, b: 220 },
        { r: 42, g: 128, b: 220 }
    );

    closeTo(result.deltaE, 0);
    closeTo(result.lightnessDifference, 0);
});
