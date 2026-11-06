(function(root, factory){
    const api = factory();

    if(typeof module === "object" && module.exports){
        module.exports = api;
        return;
    }

    root.ColorScience = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function(){
    "use strict";

    const D65 = { x: 95.047, y: 100, z: 108.883 };
    const POW_25_7 = 25 ** 7;

    function degreesToRadians(value){
        return value * Math.PI / 180;
    }

    function radiansToDegrees(value){
        return value * 180 / Math.PI;
    }

    function srgbChannelToLinear(value){
        const channel = value / 255;
        return channel <= 0.04045
            ? channel / 12.92
            : ((channel + 0.055) / 1.055) ** 2.4;
    }

    function rgbToXyz(rgb){
        const r = srgbChannelToLinear(rgb.r);
        const g = srgbChannelToLinear(rgb.g);
        const b = srgbChannelToLinear(rgb.b);

        return {
            x: (r * 0.4124564 + g * 0.3575761 + b * 0.1804375) * 100,
            y: (r * 0.2126729 + g * 0.7151522 + b * 0.0721750) * 100,
            z: (r * 0.0193339 + g * 0.1191920 + b * 0.9503041) * 100
        };
    }

    function labTransform(value){
        const delta = 6 / 29;
        return value > delta ** 3
            ? Math.cbrt(value)
            : value / (3 * delta ** 2) + 4 / 29;
    }

    function xyzToLab(xyz){
        const fx = labTransform(xyz.x / D65.x);
        const fy = labTransform(xyz.y / D65.y);
        const fz = labTransform(xyz.z / D65.z);

        return {
            l: 116 * fy - 16,
            a: 500 * (fx - fy),
            b: 200 * (fy - fz)
        };
    }

    function rgbToLab(rgb){
        return xyzToLab(rgbToXyz(rgb));
    }

    function hueDegrees(a, b){
        if(a === 0 && b === 0) return 0;
        const angle = radiansToDegrees(Math.atan2(b, a));
        return angle >= 0 ? angle : angle + 360;
    }

    function deltaE2000(lab1, lab2){
        const c1 = Math.hypot(lab1.a, lab1.b);
        const c2 = Math.hypot(lab2.a, lab2.b);
        const meanC = (c1 + c2) / 2;
        const meanC7 = meanC ** 7;
        const g = 0.5 * (1 - Math.sqrt(meanC7 / (meanC7 + POW_25_7)));

        const a1Prime = (1 + g) * lab1.a;
        const a2Prime = (1 + g) * lab2.a;
        const c1Prime = Math.hypot(a1Prime, lab1.b);
        const c2Prime = Math.hypot(a2Prime, lab2.b);
        const h1Prime = hueDegrees(a1Prime, lab1.b);
        const h2Prime = hueDegrees(a2Prime, lab2.b);

        const deltaLPrime = lab2.l - lab1.l;
        const deltaCPrime = c2Prime - c1Prime;

        let deltaHAngle = h2Prime - h1Prime;
        if(c1Prime * c2Prime === 0){
            deltaHAngle = 0;
        } else if(deltaHAngle > 180){
            deltaHAngle -= 360;
        } else if(deltaHAngle < -180){
            deltaHAngle += 360;
        }

        const deltaHPrime = 2 * Math.sqrt(c1Prime * c2Prime)
            * Math.sin(degreesToRadians(deltaHAngle / 2));
        const meanLPrime = (lab1.l + lab2.l) / 2;
        const meanCPrime = (c1Prime + c2Prime) / 2;

        let meanHPrime;
        if(c1Prime * c2Prime === 0){
            meanHPrime = h1Prime + h2Prime;
        } else if(Math.abs(h1Prime - h2Prime) <= 180){
            meanHPrime = (h1Prime + h2Prime) / 2;
        } else if(h1Prime + h2Prime < 360){
            meanHPrime = (h1Prime + h2Prime + 360) / 2;
        } else {
            meanHPrime = (h1Prime + h2Prime - 360) / 2;
        }

        const t = 1
            - 0.17 * Math.cos(degreesToRadians(meanHPrime - 30))
            + 0.24 * Math.cos(degreesToRadians(2 * meanHPrime))
            + 0.32 * Math.cos(degreesToRadians(3 * meanHPrime + 6))
            - 0.20 * Math.cos(degreesToRadians(4 * meanHPrime - 63));
        const deltaTheta = 30 * Math.exp(-(((meanHPrime - 275) / 25) ** 2));
        const meanCPrime7 = meanCPrime ** 7;
        const rc = 2 * Math.sqrt(meanCPrime7 / (meanCPrime7 + POW_25_7));
        const lightnessTerm = meanLPrime - 50;
        const sl = 1 + (0.015 * lightnessTerm ** 2) / Math.sqrt(20 + lightnessTerm ** 2);
        const sc = 1 + 0.045 * meanCPrime;
        const sh = 1 + 0.015 * meanCPrime * t;
        const rt = -Math.sin(degreesToRadians(2 * deltaTheta)) * rc;
        const l = deltaLPrime / sl;
        const c = deltaCPrime / sc;
        const h = deltaHPrime / sh;

        return Math.sqrt(l ** 2 + c ** 2 + h ** 2 + rt * c * h);
    }

    function compareRgb(rgb1, rgb2){
        const lab1 = rgbToLab(rgb1);
        const lab2 = rgbToLab(rgb2);
        return {
            deltaE: deltaE2000(lab1, lab2),
            lightnessDifference: lab1.l - lab2.l,
            lab1,
            lab2
        };
    }

    return {
        rgbToXyz,
        xyzToLab,
        rgbToLab,
        deltaE2000,
        compareRgb
    };
});
