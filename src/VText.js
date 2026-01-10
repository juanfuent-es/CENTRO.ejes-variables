/*
* VText - Gestión de texto, layout y dimensiones
* - Maneja el texto y su layout
* - Calcula dimensiones del texto
* - Dibuja el texto completo en canvas
*/

import VGlyph from './VGlyph.js';

export default class VText {
    constructor(fontAdapter, fontSize, unitsPerEm, lineHeightRatio) {
        this.txt = '';
        this.fontSize = fontSize;
        this.customLineHeightRatio = null;
        this.currentLineHeightRatio = lineHeightRatio;
        
        this.vGlyph = new VGlyph(fontAdapter, fontSize, unitsPerEm, lineHeightRatio);
        this.glyphs = [];
    }

    /**
     * Establece el texto y actualiza el layout
     */
    setText(txt, variation) {
        this.txt = txt || '';
        this.updateLayout(variation);
    }

    /**
     * Establece el tamaño de fuente y actualiza el layout
     */
    setFontSize(size, variation) {
        if (typeof size !== 'number' || size <= 0) return;
        this.fontSize = size;
        this.vGlyph.updateProperties(this.fontSize, this.vGlyph.unitsPerEm, this.currentLineHeightRatio);
        this.updateLayout(variation);
    }

    /**
     * Establece el ratio de altura de línea y actualiza el layout
     */
    setLineHeightRatio(ratio, variation) {
        if (typeof ratio !== 'number' || ratio <= 0) return;
        this.customLineHeightRatio = ratio;
        this.currentLineHeightRatio = ratio;
        this.vGlyph.updateProperties(this.fontSize, this.vGlyph.unitsPerEm, this.currentLineHeightRatio);
        this.updateLayout(variation);
    }

    /**
     * Actualiza el layout del texto basado en la variación actual
     */
    updateLayout(variation) {
        if (!this.vGlyph.fontAdapter || !this.txt) {
            this.glyphs = [];
            return;
        }
        const glyphData = this.vGlyph.getTextVariation(this.txt, variation);
        this.glyphs = this.vGlyph.createGlyphs(glyphData);
    }

    /**
     * Dibuja el texto completo en el contexto de canvas
     */
    draw(ctx, args = {}) {
        if (!ctx || this.glyphs.length === 0) return;
        let offsetX = args.offsetX || 0;
        const offsetY = args.offsetY || 0;
        for (let i = 0; i < this.glyphs.length; i++) {
            this.vGlyph.drawGlyph(ctx, this.glyphs[i], offsetX, offsetY);
            offsetX += this.glyphs[i].width;
        }
    }

    /**
     * Obtiene el ancho total del texto
     */
    getTextWidth() {
        if (this.glyphs.length === 0) return 0;
        return this.glyphs.reduce((acc, glyph) => acc + glyph.width, 0);
    }

    /**
     * Obtiene la altura de línea
     */
    getLineHeight() {
        return this.fontSize * this.currentLineHeightRatio;
    }

    /**
     * Obtiene el ancho de un carácter en el índice especificado
     */
    getCharWidthAt(index) {
        if (index < 0 || index >= this.glyphs.length) return 0;
        return this.glyphs[index].width;
    }

    /**
     * Obtiene el glifo en el índice especificado
     */
    getGlyphAt(index) {
        if (index < 0 || index >= this.glyphs.length) return null;
        return this.glyphs[index];
    }

    /**
     * Actualiza el adaptador de fuente (cuando la fuente se carga)
     */
    setFontAdapter(fontAdapter, unitsPerEm, fontLineHeightRatio) {
        this.vGlyph.fontAdapter = fontAdapter;
        this.vGlyph.unitsPerEm = unitsPerEm;
        if (this.customLineHeightRatio === null) {
            this.currentLineHeightRatio = fontLineHeightRatio;
        }
        this.vGlyph.updateProperties(this.fontSize, unitsPerEm, this.currentLineHeightRatio);
    }
}

