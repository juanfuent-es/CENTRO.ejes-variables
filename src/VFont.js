/*
* VFont - Gestor unificado de fuente variable:
* - Carga la fuente (Typr.js vía loadFont)
* - Expone ejes y valores actuales
* - Genera glifos y los dibuja en canvas
* - Permite recalcular en tiempo real al cambiar texto, tamaño o ejes
*/

import { loadFont } from '../utils/fontloader.js';
import Glyph from './glyph.js';

export default class VFont extends EventTarget {
    constructor(params = {}) {
        super();
        this.validateParams(params);
        this.initializeProperties(params);
        this.load();
    }

    validateParams(params) {
        if (!params.font) {
            throw new Error('VFont: se requiere la ruta de la fuente variable (font).');
        }
    }

    initializeProperties(params) {
        this.fontPath = params.font;
        this.txt = params.txt || '';
        this.fontSize = params.fontSize || 100;
        this.customLineHeightRatio = typeof params.lineHeight === 'number' ? params.lineHeight : null;

        // Valores de ejes explícitos (wght, wdth, slnt, ital, opsz, etc.)
        this.axisValues = { ...(params.axes || params) };
        // Limpiamos claves que no son ejes
        ['font', 'txt', 'fontSize', 'lineHeight'].forEach(k => delete this.axisValues[k]);

        this.fontAdapter = null; // TyprFontAdapter desde fontloader
        this.axes = {};          // Definición de ejes (min, max, default, ...)
        this.unitsPerEm = 1024;
        this.fontLineHeightRatio = 0.75;
        this.currentLineHeightRatio = this.customLineHeightRatio || this.fontLineHeightRatio;

        this.glyphs = [];
        this.ready = false;
        this.readyCallbacks = [];
    }

    async load() {
        try {
            const font = await loadFont(this.fontPath);
            this.setFontData(font);
            this.updateLayout();
            this.ready = true;
            this.flushReadyCallbacks();
            this.dispatchEvent(new Event('fontloaded'));
        } catch (error) {
            console.error('VFont: error cargando la fuente', error);
            this.dispatchEvent(new Event('fontloaderror'));
        }
    }

    setFontData(fontAdapter) {
        this.fontAdapter = fontAdapter;
        this.axes = fontAdapter.variationAxes || {};
        this.unitsPerEm = typeof fontAdapter.getUnitsPerEm === 'function'
            ? fontAdapter.getUnitsPerEm()
            : 1024;
        this.fontLineHeightRatio = typeof fontAdapter.getLineHeightRatio === 'function'
            ? fontAdapter.getLineHeightRatio()
            : 0.75;
        this.currentLineHeightRatio = this.customLineHeightRatio || this.fontLineHeightRatio;
    }

    loaded(callback) {
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

    // ----------- Gestión de ejes -----------

    /**
     * Devuelve la definición de los ejes variables disponibles.
     * { wght: {min, max, default, ...}, wdth: {...}, ... }
     */
    getAxes() {
        return this.axes;
    }

    /**
     * Devuelve el valor actual de un eje concreto.
     */
    getAxisValue(tag) {
        const axis = this.axes[tag];
        if (!axis) return undefined;
        if (typeof this.axisValues[tag] === 'number') {
            return this.axisValues[tag];
        }
        return axis.default;
    }

    /**
     * Actualiza un eje concreto y recalcula la variación.
     */
    setAxis(tag, value) {
        if (!this.axes[tag]) return;
        this.axisValues[tag] = value;
        this.updateLayout();
    }

    /**
     * Actualiza varios ejes a la vez.
     */
    setAxes(values = {}) {
        Object.keys(values).forEach(tag => {
            if (this.axes[tag]) {
                this.axisValues[tag] = values[tag];
            }
        });
        this.updateLayout();
    }

    /**
     * Objeto de variación normalizado según los ejes disponibles.
     */
    get variation() {
        const variation = {};
        Object.keys(this.axes).forEach(tag => {
            variation[tag] = this.getAxisValue(tag);
        });
        return variation;
    }

    // ----------- Texto y tamaño -----------

    setText(txt) {
        this.txt = txt || '';
        this.updateLayout();
    }

    setFontSize(size) {
        if (typeof size !== 'number' || size <= 0) return;
        this.fontSize = size;
        this.updateLayout();
    }

    setLineHeightRatio(ratio) {
        if (typeof ratio !== 'number' || ratio <= 0) return;
        this.customLineHeightRatio = ratio;
        this.currentLineHeightRatio = ratio;
        this.updateLayout();
    }

    // ----------- Layout y glifos -----------

    updateLayout() {
        if (!this.fontAdapter || !this.txt) {
            this.glyphs = [];
            return;
        }
        const glyphData = this.getTextVariation(this.txt, this.variation);
        this.createGlyphs(glyphData);
    }

    getTextVariation(txt, variationParams) {
        if (!txt) return [];
        const variation = this.fontAdapter.getVariation(variationParams);
        const run = variation.layout(txt);
        return run.glyphs || [];
    }

    createGlyphs(glyphData = []) {
        this.glyphs = [];
        for (let i = 0; i < glyphData.length; i++) {
            this.createGlyph(glyphData[i]);
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

    // ----------- Dibujo -----------

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

    // ----------- Métricas -----------

    getTextWidth() {
        if (!this.ready) return 0;
        return this.glyphs.reduce((acc, glyph) => acc + glyph.width, 0);
    }

    getLineHeight() {
        return this.fontSize * this.currentLineHeightRatio;
    }

    /**
     * Ancho de un carácter dentro del texto actual por índice.
     */
    getCharWidthAt(index) {
        if (index < 0 || index >= this.glyphs.length) return 0;
        return this.glyphs[index].width;
    }

    /**
     * Devuelve el glifo (objeto Glyph) de un índice del texto actual.
     */
    getGlyphAt(index) {
        if (index < 0 || index >= this.glyphs.length) return null;
        return this.glyphs[index];
    }
}


