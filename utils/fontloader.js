const FALLBACK_UNITS_PER_EM = 1024;

function resolveTypr() {
    if (typeof Typr !== 'undefined') return Typr;
    if (typeof window !== 'undefined' && window.Typr) return window.Typr;
    throw new Error('Typr.js no está disponible en el contexto actual.');
}

class TyprFontAdapter {
    constructor(typr, rawFont) {
        this.typr = typr;
        this.rawFont = rawFont;
        this.unitsPerEm = this.computeUnitsPerEm();
        this.lineHeightUnits = this.computeLineHeightUnits();
        this.variationAxes = this.extractVariationAxes();
        this.axisOrder = Object.keys(this.variationAxes);
    }

    computeUnitsPerEm() {
        return (this.rawFont.head && this.rawFont.head.unitsPerEm) || FALLBACK_UNITS_PER_EM;
    }

    computeLineHeightUnits() {
        const ascent = (this.rawFont.hhea && this.rawFont.hhea.ascent) || this.unitsPerEm * 0.8;
        const descent = Math.abs((this.rawFont.hhea && this.rawFont.hhea.descent) || -(this.unitsPerEm * 0.2));
        return ascent + descent;
    }

    extractVariationAxes() {
        const axes = {};
        if (!this.rawFont.fvar || !this.rawFont.fvar[0]) return axes;
        this.rawFont.fvar[0].forEach(axis => {
            const [tag, min, defaultValue, max] = axis;
            axes[tag] = { tag, min, max, default: defaultValue };
        });
        return axes;
    }

    getUnitsPerEm() {
        return this.unitsPerEm;
    }

    getLineHeightRatio() {
        return this.lineHeightUnits / this.unitsPerEm;
    }

    hasAxis(tag) {
        return Boolean(this.variationAxes[tag]);
    }

    getVariation(axisValues = {}) {
        const normalized = this.normalizeAxisValues(axisValues);
        return {
            layout: text => ({
                glyphs: this.layoutText(text, normalized)
            })
        };
    }

    layoutText(text = '', axisValues = {}) {
        if (!text) return [];
        const axisArray = this.axisOrder.length ? this.axisOrder.map(tag => axisValues[tag]) : undefined;
        const shapeOptions = { ltr: true };
        if (axisArray) {
            shapeOptions.axs = axisArray;
        }
        const shape = this.typr.U.shape(this.rawFont, text, shapeOptions);
        return shape.map((shapeGlyph, index) => this.createGlyph(shapeGlyph, text, index, axisArray));
    }

    createGlyph(shapeGlyph, text, index, axisArray) {
        const path = this.typr.U.glyphToPath(this.rawFont, shapeGlyph.g, false, axisArray);
        const commands = this.convertPathCommands(path);
        return {
            name: this.getGlyphName(shapeGlyph, text, index),
            advanceWidth: shapeGlyph.ax,
            advanceHeight: this.lineHeightUnits,
            path: { commands }
        };
    }

    normalizeAxisValues(values = {}) {
        const normalized = {};
        this.axisOrder.forEach(tag => {
            const axis = this.variationAxes[tag];
            const candidate = values[tag] ?? axis.default;
            normalized[tag] = this.clamp(candidate, axis.min, axis.max);
        });
        return normalized;
    }

    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    convertPathCommands(path) {
        const commands = [];
        if (!path || !path.cmds || !path.crds) return commands;
        let coordIndex = 0;
        path.cmds.forEach(cmd => {
            if (cmd === 'M') {
                commands.push({ command: 'moveTo', args: this.takeCoords(path.crds, coordIndex, 2) });
                coordIndex += 2;
            } else if (cmd === 'L') {
                commands.push({ command: 'lineTo', args: this.takeCoords(path.crds, coordIndex, 2) });
                coordIndex += 2;
            } else if (cmd === 'C') {
                commands.push({ command: 'bezierCurveTo', args: this.takeCoords(path.crds, coordIndex, 6) });
                coordIndex += 6;
            } else if (cmd === 'Q') {
                commands.push({ command: 'quadraticCurveTo', args: this.takeCoords(path.crds, coordIndex, 4) });
                coordIndex += 4;
            } else if (cmd === 'Z') {
                commands.push({ command: 'closePath', args: [] });
            } else {
                // Saltar comandos de color o separadores específicos de Typr
                if (typeof cmd === 'string') {
                    if (cmd.charAt(0) === '#' || cmd === 'X') return;
                }
            }
        });
        return commands;
    }

    takeCoords(coords, start, length) {
        return coords.slice(start, start + length);
    }

    getGlyphName(shapeGlyph, text, index) {
        const post = this.rawFont['post'];
        if (post && post.names && post.names[shapeGlyph.g]) {
            return post.names[shapeGlyph.g];
        }
        const charIndex = typeof shapeGlyph.cl === 'number' ? shapeGlyph.cl : index;
        const char = text.codePointAt(charIndex);
        if (char) {
            return String.fromCodePoint(char);
        }
        return `glyph-${shapeGlyph.g}`;
    }
}

export async function loadFont(source) {
    if (!source) {
        throw new Error('Se requiere la ruta de la fuente para cargarla.');
    }
    const typr = resolveTypr();
    const response = await fetch(source);
    if (!response.ok) {
        throw new Error(`No se pudo cargar la fuente (${response.status} ${response.statusText})`);
    }
    const buffer = await response.arrayBuffer();
    const parsed = typr.parse(buffer);
    const font = Array.isArray(parsed) ? parsed[0] : parsed;
    return new TyprFontAdapter(typr, font);
}

