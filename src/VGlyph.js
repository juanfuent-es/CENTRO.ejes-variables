/*
* VGlyph - Gestión de creación y dibujo de glifos individuales
* - Crea glifos a partir de datos de fuente
* - Dibuja glifos individuales en canvas
*/

import Glyph from './glyph.js';

export default class VGlyph {
    constructor(fontAdapter, fontSize, unitsPerEm, lineHeightRatio) {
        this.fontAdapter = fontAdapter;
        this.fontSize = fontSize;
        this.unitsPerEm = unitsPerEm;
        this.lineHeightRatio = lineHeightRatio;
    }

    /**
     * Obtiene la variación de texto desde el adaptador de fuente
     */
    getTextVariation(txt, variationParams) {
        if (!txt || !this.fontAdapter) return [];
        const variation = this.fontAdapter.getVariation(variationParams);
        const run = variation.layout(txt);
        return run.glyphs || [];
    }

    /**
     * Crea un array de glifos a partir de datos de glifos en bruto
     */
    createGlyphs(glyphData = []) {
        const glyphs = [];
        for (let i = 0; i < glyphData.length; i++) {
            const glyph = this.createGlyph(glyphData[i]);
            if (glyph) {
                glyphs.push(glyph);
            }
        }
        return glyphs;
    }

    /**
     * Crea un glifo individual a partir de datos en bruto
     */
    createGlyph(rawGlyph) {
        if (!rawGlyph) return null;
        const glyph = new Glyph(rawGlyph.name, this.getGlyphParams(rawGlyph));
        return glyph;
    }

    /**
     * Obtiene los parámetros necesarios para crear un glifo
     */
    getGlyphParams(rawGlyph) {
        return {
            fontSize: this.fontSize,
            commands: (rawGlyph.path && rawGlyph.path.commands) ? rawGlyph.path.commands : [],
            width: typeof rawGlyph.advanceWidth === 'number' ? rawGlyph.advanceWidth : 0,
            height: typeof rawGlyph.advanceHeight === 'number' ? rawGlyph.advanceHeight : this.unitsPerEm,
            lineHeight: this.lineHeightRatio,
            unitsPerEm: this.unitsPerEm
        };
    }

    /**
     * Dibuja un glifo individual en el contexto de canvas
     */
    drawGlyph(ctx, glyph, offsetX, offsetY) {
        if (!ctx || !glyph) return;
        glyph.draw(ctx, { offset_x: offsetX, offset_y: offsetY });
    }

    /**
     * Actualiza las propiedades de tamaño y ratio de línea
     */
    updateProperties(fontSize, unitsPerEm, lineHeightRatio) {
        this.fontSize = fontSize;
        this.unitsPerEm = unitsPerEm;
        this.lineHeightRatio = lineHeightRatio;
    }
}

