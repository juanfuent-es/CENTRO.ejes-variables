/**
 * Clase VFont
 * Wrapper ligero sobre Typr.js para trabajar con fuentes variables.
 * - Guarda nombre de la fuente
 * - Guarda / lee ejes variables
 * - Expone métodos para obtener dimensiones por caracter o por texto
 *
 * Requiere:
 * - Typr.js (Typr y Typr.U disponibles en el scope global)
 * - Un objeto de fuente parseado con Typr.parse()
 */

class VFont {
  /**
   * @param {string} name        Nombre de la fuente (identificador lógico)
   * @param {Object} typrFont   Objeto de fuente devuelto por Typr.parse()
   * @param {Object} axesInfo   Objeto de ejes variables (opcional)
   */
  constructor(name, typrFont, axesInfo = null) {
    if (!typrFont) {
      throw new Error('VFont requiere un objeto de fuente de Typr válido');
    }

    this.name = name || 'VFont';
    this.font = typrFont;

    // Ejes variables disponibles (ej: { wght: {min, max, default, ...}, ... })
    this.axes = axesInfo || this._extractAxesFromFont(typrFont);

    // Valores actuales de ejes (puedes modificarlos con setAxes)
    this.currentAxes = {};
    Object.keys(this.axes).forEach(tag => {
      this.currentAxes[tag] = this.axes[tag].default;
    });
  }

  /**
   * Crea una VFont cargando una fuente desde URL usando fetch + Typr.parse
   * @param {string} url   Ruta a la fuente .ttf / .otf variable
   * @param {string} name  Nombre lógico de la fuente
   * @returns {Promise<VFont>}
   */
  static async fromUrl(url, name) {
    const res = await fetch(url);
    const buf = await res.arrayBuffer();
    const font = Typr.parse(buf);
    return new VFont(name || url, font);
  }

  /**
   * Extrae ejes variables a partir de la tabla fvar de Typr
   */
  _extractAxesFromFont(font) {
    const axes = {};

    if (!font.fvar) return axes;

    const [axesArray] = font.fvar; // [axes, instances]
    if (!axesArray || axesArray.length === 0) return axes;

    axesArray.forEach(axis => {
      // Formato Typr: [tag, min, default, max, flags, name]
      const [tag, min, defaultValue, max, flags, name] = axis;
      axes[tag] = {
        tag,
        name: name || tag,
        min,
        max,
        default: defaultValue,
        flags
      };
    });

    return axes;
  }

  /**
   * Devuelve la información de todos los ejes variables
   */
  getVariableAxes() {
    return this.axes;
  }

  /**
   * Devuelve info de un eje específico (ej: 'wght', 'wdth', 'opsz')
   */
  getAxis(axisTag) {
    return this.axes[axisTag] || null;
  }

  /**
   * Actualiza los valores actuales de ejes
   * @param {Object} axesValues Ej: { wght: 700, wdth: 120 }
   */
  setAxes(axesValues) {
    if (!axesValues) return;

    Object.keys(axesValues).forEach(tag => {
      if (!this.axes[tag]) return;

      const axis = this.axes[tag];
      const v = axesValues[tag];

      // Clampeamos al rango permitido del eje
      const clamped = Math.max(axis.min, Math.min(axis.max, v));
      this.currentAxes[tag] = clamped;
    });
  }

  /**
   * Devuelve los valores actuales de ejes
   */
  getAxesValues() {
    return { ...this.currentAxes };
  }

  /**
   * Interno: genera el shape de Typr para un texto con los ejes indicados
   * @param {string} text
   * @param {Object} axesValues  (opcional) si no se pasa, usa this.currentAxes
   */
  _shape(text, axesValues) {
    if (!text || text.length === 0) return [];

    const font = this.font;
    const valuesObj = axesValues || this.currentAxes || {};

    // Typr.U.shape espera un array de coordenadas en la propiedad "axs".
    // Aquí usamos Object.values, igual que en p5.variableFont.js.
    const axs = Object.keys(valuesObj).length > 0
      ? Object.values(valuesObj)
      : [];

    const shape = Typr.U.shape(font, text, {
      ltr: true,
      fts: {},
      axs
    });

    return shape || [];
  }

  /**
   * Devuelve el ancho (en px) de un caracter
   * @param {string} ch
   * @param {number} fontSize  Tamaño de fuente en px
   * @param {Object} axesValues  (opcional)
   */
  getCharWidth(ch, fontSize = 16, axesValues = null) {
    if (!ch) return 0;
    const shape = this._shape(ch[0], axesValues);

    let advance = 0;
    shape.forEach(g => {
      advance += g.ax || 0;
    });

    const unitsPerEm = this.font.head.unitsPerEm || 1000;
    const scale = fontSize / unitsPerEm;
    return advance * scale;
  }

  /**
   * Devuelve el ancho (en px) de un texto completo
   * @param {string} text
   * @param {number} fontSize
   * @param {Object} axesValues
   */
  getTextWidth(text, fontSize = 16, axesValues = null) {
    if (!text) return 0;

    const shape = this._shape(text, axesValues);
    let advance = 0;
    shape.forEach(g => {
      advance += g.ax || 0;
    });

    const unitsPerEm = this.font.head.unitsPerEm || 1000;
    const scale = fontSize / unitsPerEm;
    return advance * scale;
  }

  /**
   * Devuelve métricas básicas de texto (similar a getVariableTextMetrics)
   * @param {string} text
   * @param {number} fontSize
   * @param {Object} axesValues
   * @returns {{width:number,height:number,ascent:number,descent:number,lineHeight:number,numLines:number,lineWidths:number[],maxLineWidth:number}}
   */
  getTextMetrics(text, fontSize = 16, axesValues = null) {
    const unitsPerEm = this.font.head.unitsPerEm || 1000;
    const scale = fontSize / unitsPerEm;

    const lines = (text || '').split('\n');

    // Ascent / descent de la fuente
    const ascentUnits =
      (this.font.hhea && this.font.hhea.ascent) || unitsPerEm * 0.8;
    const descentUnits =
      (this.font.hhea && this.font.hhea.descent) || -unitsPerEm * 0.2;

    const ascent = ascentUnits * scale;
    const descent = Math.abs(descentUnits) * scale;
    const lineHeight = ascent + descent;

    const lineWidths = lines.map(line =>
      this.getTextWidth(line, fontSize, axesValues)
    );

    const maxLineWidth = lineWidths.length
      ? Math.max(...lineWidths)
      : 0;

    return {
      width: this.getTextWidth(text, fontSize, axesValues),
      height: lineHeight * lines.length,
      ascent,
      descent,
      lineHeight,
      numLines: lines.length,
      lineWidths,
      maxLineWidth
    };
  }
}

// Si estamos en navegador, exponer la clase en el objeto window
if (typeof window !== 'undefined') {
  window.VFont = VFont;
}


