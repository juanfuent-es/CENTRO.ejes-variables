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
        this.slnt = params.slnt;
        this.ital = params.ital;
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
        if (this.font.hasAxis('slnt') && typeof this.slnt !== 'undefined') {
            axes.slnt = this.slnt;
        }
        if (this.font.hasAxis('ital') && typeof this.ital !== 'undefined') {
            axes.ital = this.ital;
        }
        return axes;
    }

    /**
     * Devuelve la definición de los ejes variables disponibles en la fuente.
     * Estructura habitual:
     * {
     *   wght: { min: Number, max: Number, default: Number },
     *   wdth: { min: Number, max: Number, default: Number },
     *   ...
     * }
     * Si la fuente aún no está cargada, devuelve un objeto vacío.
     */
    getAxes() {
        if (!this.font || typeof this.font.isLoaded !== 'function' || !this.font.isLoaded()) {
            return {};
        }
        if (typeof this.font.getAxes === 'function') {
            return this.font.getAxes();
        }
        return {};
    }

    getTextWidth() {
        if (!this.ready) return 0;
        return this.glyphs.reduce((acc, glyph) => acc + glyph.width, 0);
    }

    getLineHeight() {
        return this.fontSize * this.currentLineHeightRatio;
    }

    /**
     * Actualiza las propiedades de la instancia (texto, tamaño, ejes, etc.)
     * y regenera los glifos. Pensado para ser llamado desde lil.gui.
     *
     * @param {Object} params
     *  - txt: string
     *  - fontSize: number
     *  - lineHeight: number (ratio)
     *  - wght, wdth, slnt, ital, ...: valores de ejes
     */
    update(params = {}) {
        if (!params || typeof params !== 'object') return;

        // Texto
        if (typeof params.txt === 'string') {
            this.txt = params.txt;
        }

        // Tamaño de fuente
        if (typeof params.fontSize === 'number') {
            this.fontSize = params.fontSize;
        }

        // Altura de línea (ratio)
        if (typeof params.lineHeight === 'number') {
            this.customLineHeightRatio = params.lineHeight;
            this.currentLineHeightRatio = this.customLineHeightRatio || this.fontLineHeightRatio;
        }

        // Ejes específicos
        ['wght', 'wdth', 'slnt', 'ital'].forEach(axis => {
            if (Object.prototype.hasOwnProperty.call(params, axis)) {
                this[axis] = params[axis];
            }
        });

        // Cualquier otro eje soportado por la fuente
        if (this.font && typeof this.font.getAxes === 'function') {
            const axes = this.font.getAxes();
            Object.keys(params).forEach(key => {
                if (axes[key] && !['wght', 'wdth', 'slnt', 'ital', 'txt', 'fontSize', 'lineHeight'].includes(key)) {
                    this[key] = params[key];
                }
            });
        }

        // Recalcular glifos si la fuente está lista
        if (this.font && typeof this.font.isLoaded === 'function' && this.font.isLoaded()) {
            const glyphData = this.font.textVariation(this.txt, this.variation);
            this.createGlyphs(glyphData);
        }
    }
}