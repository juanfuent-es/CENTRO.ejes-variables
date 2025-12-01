import { loadFont } from '../utils/fontloader.js';

/**
* VariableFont - Load and manipulate variable fonts
* @extends EventTarget
*/
export default class VariableFont extends EventTarget {
    constructor(source) {
        super();
        this.validateSource(source);
        this.initializeProperties(source);
        this.loadFont();
    }

    validateSource(source) {
        if (!source) throw new Error("VFont: No source provided");
    }

    initializeProperties(source) {
        this.src = source;
        this.axes = {};
        this.font = null;
        this.unitsPerEm = 1024;
        this.lineHeightRatio = 0.75;
    }

    async loadFont() {
        try {
            const font = await loadFont(this.src);
            this.setFontData(font);
            this.dispatchEvent(new Event('fontloaded'));
        } catch (error) {
            this.handleLoadError(error);
        }
    }

    setFontData(font) {
        this.font = font;
        this.axes = font.variationAxes || {};
        this.unitsPerEm = typeof font.getUnitsPerEm === 'function' ? font.getUnitsPerEm() : 1024;
        this.lineHeightRatio = typeof font.getLineHeightRatio === 'function' ? font.getLineHeightRatio() : 0.75;
    }

    handleLoadError(error) {
        console.error("Error loading font:", error);
        this.dispatchEvent(new Event('fontloaderror'));
    }

    glyphVariation(char, args = {}) {
        this.validateFontLoaded();
        const variationParams = this.getVariationParams(args);
        return this.getGlyphVariation(char, variationParams);
    }

    textVariation(txt, args = {}) {
        this.validateFontLoaded();
        const variationParams = this.getVariationParams(args);
        return this.getTextVariation(txt, variationParams);
    }

    validateFontLoaded() {
        if (!this.font) {
            throw new Error("Font not loaded yet. Wait for 'fontloaded' event.");
        }
    }

    getVariationParams(args = {}) {
        const params = {};
        Object.keys(this.axes).forEach(axis => {
            params[axis] = this.normalizeAxisValue(axis, args[axis]);
        });
        return params;
    }

    normalizeAxisValue(axis, value) {
        const axisData = this.axes[axis];
        if (!axisData) return undefined;
        const resolved = typeof value === 'number' ? value : axisData.default;
        return Math.max(axisData.min, Math.min(axisData.max, resolved));
    }

    getAxes() {
        return this.axes;
    }

    hasAxis(axis) {
        return Boolean(this.axes[axis]);
    }

    isLoaded() {
        return this.font !== null;
    }

    getUnitsPerEm() {
        return this.unitsPerEm;
    }

    getLineHeightRatio() {
        return this.lineHeightRatio;
    }

    getGlyphVariation(char, variationParams) {
        const variation = this.font.getVariation(variationParams);
        const run = variation.layout(char);
        return run.glyphs[0];
    }

    getTextVariation(txt, variationParams) {
        if (!txt) return [];
        const variation = this.font.getVariation(variationParams);
        const run = variation.layout(txt);
        return run.glyphs || [];
    }
}