/*
* VFont - Core de carga de fuente variable:
* - Carga la fuente (Typr.js vía loadFont)
* - Expone ejes y valores actuales
* - Eventos: fontloaded, fontloaderror
* - Callbacks: loaded()
* - Gestión de ejes: getAxes(), getAxisValue(), setAxis(), setAxes()
*/

import { loadFont } from '../utils/fontloader.js';
import VText from './VText.js';

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
        const txt = params.txt || '';
        const fontSize = params.fontSize || 100;
        const customLineHeightRatio = typeof params.lineHeight === 'number' ? params.lineHeight : null;

        // Valores de ejes explícitos (wght, wdth, slnt, ital, opsz, etc.)
        this.axisValues = { ...(params.axes || params) };
        // Limpiamos claves que no son ejes
        ['font', 'txt', 'fontSize', 'lineHeight'].forEach(k => delete this.axisValues[k]);

        this.fontAdapter = null; // TyprFontAdapter desde fontloader
        this.axes = {};          // Definición de ejes (min, max, default, ...)
        this.unitsPerEm = 1024;
        this.fontLineHeightRatio = 0.75;

        // Inicializar VText con valores por defecto
        this.vText = new VText(null, fontSize, this.unitsPerEm, this.fontLineHeightRatio);
        if (customLineHeightRatio !== null) {
            this.vText.customLineHeightRatio = customLineHeightRatio;
            this.vText.currentLineHeightRatio = customLineHeightRatio;
        }
        if (txt) {
            this.vText.setText(txt, this.variation);
        }

        this.ready = false;
        this.readyCallbacks = [];
    }

    async load() {
        try {
            const font = await loadFont(this.fontPath);
            this.setFontData(font);
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
        
        // Actualizar VText con los datos de la fuente
        this.vText.setFontAdapter(fontAdapter, this.unitsPerEm, this.fontLineHeightRatio);
        // Actualizar layout con la variación actual
        this.vText.updateLayout(this.variation);
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
        this.vText.updateLayout(this.variation);
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
        this.vText.updateLayout(this.variation);
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

    // ----------- Delegación a VText -----------

    setText(txt) {
        this.vText.setText(txt, this.variation);
    }

    setFontSize(size) {
        this.vText.setFontSize(size, this.variation);
    }

    setLineHeightRatio(ratio) {
        this.vText.setLineHeightRatio(ratio, this.variation);
    }

    draw(ctx, args = {}) {
        if (!this.ready || !ctx) return;
        this.vText.draw(ctx, args);
    }

    getTextWidth() {
        if (!this.ready) return 0;
        return this.vText.getTextWidth();
    }

    getLineHeight() {
        return this.vText.getLineHeight();
    }

    getCharWidthAt(index) {
        return this.vText.getCharWidthAt(index);
    }

    getGlyphAt(index) {
        return this.vText.getGlyphAt(index);
    }
}