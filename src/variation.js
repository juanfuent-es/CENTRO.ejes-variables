/*
* Variation - Text variation from variable font
* Author: JuanFuent.es
*/
import VariableFont from './variable_font.js';
import Glyph from './glyph.js';

export default class Variation {
    constructor(params) {
        this.validateParams(params);
        this.initializeProperties(params);
        this.initializeFont();
    }

    validateParams(params = {}) {
        if (!params.font) {
            throw new Error('Se requiere la ruta de la fuente variable.');
        }
    }

    initializeProperties(params) {
        this.fontPath = params.font;
        this.txt = params.txt || 'Hola';
        this.fontSize = params.fontSize || 300;
        this.wght = params.wght;
        this.wdth = params.wdth;
        this.customLineHeightRatio = typeof params.lineHeight === 'number' ? params.lineHeight : null;
        this.glyphs = [];
        this.ready = false;
        this.readyCallbacks = [];
        this.unitsPerEm = 1024;
        this.fontLineHeightRatio = 0.75;
        this.currentLineHeightRatio = this.customLineHeightRatio || this.fontLineHeightRatio;
    }

    initializeFont() {
        this.font = new VariableFont(this.fontPath);
        this.font.addEventListener('fontloaded', () => this.setup());
        this.font.addEventListener('fontloaderror', () => {
            console.error('No se pudo cargar la fuente variable.');
        });
    }

    setup() {
        this.unitsPerEm = this.font.getUnitsPerEm();
        this.fontLineHeightRatio = this.font.getLineHeightRatio();
        this.currentLineHeightRatio = this.customLineHeightRatio || this.fontLineHeightRatio;
        const glyphData = this.font.textVariation(this.txt, this.variation);
        this.createGlyphs(glyphData);
        this.ready = true;
        this.flushReadyCallbacks();
    }

    createGlyphs(txt = []) {
        this.glyphs = [];
        for (let i = 0; i < txt.length; i++) {
            this.createGlyph(txt[i]);
        }
    }

    createGlyph(rawGlyph) {
        if (!rawGlyph) return;
        const glyph = new Glyph(rawGlyph.name, this.getGlyphParams(rawGlyph));
        this.glyphs.push(glyph);
    }

    getGlyphParams(rawGlyph) {
        return {
            fontSize: this.fontSize,
            commands: (rawGlyph.path && rawGlyph.path.commands) ? rawGlyph.path.commands : [],
            width: typeof rawGlyph.advanceWidth === 'number' ? rawGlyph.advanceWidth : 0,
            height: typeof rawGlyph.advanceHeight === 'number' ? rawGlyph.advanceHeight : this.unitsPerEm,
            lineHeight: this.currentLineHeightRatio,
            unitsPerEm: this.unitsPerEm
        };
    }

    draw(ctx, args = {}) {
        if (!this.ready || !ctx) return;
        let offsetX = args.offsetX || 0;
        const offsetY = args.offsetY || 0;
        for (let i = 0; i < this.glyphs.length; i++) {
            this.drawGlyph(ctx, this.glyphs[i], offsetX, offsetY);
            offsetX += this.glyphs[i].width;
        }
    }

    drawGlyph(ctx, glyph, offsetX, offsetY) {
        glyph.draw(ctx, { offset_x: offsetX, offset_y: offsetY });
    }

    whenReady(callback) {
        if (typeof callback !== 'function') return;
        if (this.ready) {
            callback(this);
        } else {
            this.readyCallbacks.push(callback);
        }
    }

    flushReadyCallbacks() {
        while (this.readyCallbacks.length) {
            const cb = this.readyCallbacks.shift();
            cb(this);
        }
    }

    get variation() {
        if (!this.font) {
            return {};
        }
        const axes = {};
        if (this.font.hasAxis('wght') && typeof this.wght !== 'undefined') {
            axes.wght = this.wght;
        }
        if (this.font.hasAxis('wdth') && typeof this.wdth !== 'undefined') {
            axes.wdth = this.wdth;
        }
        return axes;
    }

    getTextWidth() {
        if (!this.ready) return 0;
        return this.glyphs.reduce((acc, glyph) => acc + glyph.width, 0);
    }

    getLineHeight() {
        return this.fontSize * this.currentLineHeightRatio;
    }
}