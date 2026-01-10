/**
 * FitText - Clase principal para ajustar texto en elementos HTML usando fuentes variables
 * Responsabilidad: Coordinar el ajuste de texto, renderizar caracteres como spans, aplicar estilos
 */

import TextMeasurer from './fitText/TextMeasurer.js';
import AxisCalculator from './fitText/AxisCalculator.js';
import StyleApplier from './fitText/StyleApplier.js';

export default class FitText {
  constructor(element, options = {}) {
    if (!element || !(element instanceof HTMLElement)) {
      throw new Error('FitText: se requiere un elemento HTML válido');
    }

    this.element = element;
    this.options = {
      fontFamily: options.fontFamily || 'Google Sans Flex, sans-serif',
      relevance: this.parseRelevance(element, options.relevance),
      lineHeightRatio: options.lineHeightRatio || 1.2,
      minFontSize: options.minFontSize || 8,
      maxFontSize: options.maxFontSize || 1000,
      ...options
    };

    // Inicializar componentes
    this.measurer = new TextMeasurer();
    this.calculator = new AxisCalculator({
      lineHeightRatio: this.options.lineHeightRatio,
      minFontSize: this.options.minFontSize,
      maxFontSize: this.options.maxFontSize
    });
    this.styleApplier = new StyleApplier(this.options.fontFamily);

    // Estado interno
    this.charSpans = [];
    this.currentAxes = {};
    this.currentFontSize = null;
    this.flexEnabled = false;

    // Renderizar texto como spans desde el inicio
    const text = this.extractText(element);
    this.renderAsSpans(text);

    // Aplicar estilos base
    this.styleApplier.applyAxisValues(this.element, {});
  }

  /**
   * Extrae el texto del elemento, preservando espacios y saltos de línea
   * @param {HTMLElement} element - Elemento HTML
   * @returns {string} Texto extraído
   */
  extractText(element) {
    return element.textContent || element.innerText || '';
  }

  /**
   * Parsea el valor de relevance desde atributo data o options
   * @param {HTMLElement} element - Elemento HTML
   * @param {number|undefined} optionsRelevance - Relevance desde options
   * @returns {number} Valor de relevance (0-1)
   */
  parseRelevance(element, optionsRelevance) {
    if (typeof optionsRelevance === 'number') {
      return Math.max(0, Math.min(1, optionsRelevance));
    }

    const dataRelevance = element.dataset.relevance;
    if (dataRelevance) {
      const parsed = parseFloat(dataRelevance);
      if (!isNaN(parsed)) {
        return Math.max(0, Math.min(1, parsed));
      }
    }

    return 0.5; // Default
  }

  /**
   * Renderiza el texto como array de spans, cada carácter en su propio span
   * @param {string} text - Texto a renderizar
   */
  renderAsSpans(text) {
    // Limpiar contenido anterior
    this.element.innerHTML = '';
    this.charSpans = [];

    // Crear un span por cada carácter
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const span = document.createElement('span');
      
      // Preservar espacios como non-breaking space para mejor control
      span.textContent = char === ' ' ? '\u00A0' : char;
      
      this.element.appendChild(span);
      this.charSpans.push(span);
    }
  }

  /**
   * Ejecuta el algoritmo completo de ajuste de texto
   */
  fit() {
    // Obtener dimensiones del contenedor
    const containerRect = this.element.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;

    if (containerWidth <= 0 || containerHeight <= 0) {
      console.warn('FitText: dimensiones del contenedor inválidas');
      return;
    }

    // 1. Calcular weight y grade desde relevance
    const weight = this.calculator.calculateWeight(this.options.relevance);
    const grade = this.calculator.calculateGrade(this.options.relevance);

    // 2. Obtener valores de ejes desde GUI o defaults
    const initialAxes = {
      wght: weight,
      GRAD: grade,
      wdth: this.calculator.axisRanges.wdth.default,
      slnt: this.currentAxes.slnt ?? this.calculator.axisRanges.slnt.default,
      ROND: this.currentAxes.ROND ?? this.calculator.axisRanges.ROND.default
    };

    // 3. Calcular fontSize máximo que no desborda ancho
    const measureWidthCallback = (fontSize, axes) => {
      this.styleApplier.applyFontSize(this.element, fontSize);
      this.styleApplier.applyAxisValues(this.element, axes);
      // Forzar reflow para que los cambios se apliquen
      void this.element.offsetWidth;
      const width = this.measurer.measureWidth(this.element);
      return width;
    };

    const fontSize = this.calculator.calculateMaxFontSize(
      containerHeight,
      containerWidth,
      measureWidthCallback,
      initialAxes
    );

    // 4. Calcular width óptimo con fontSize determinado
    const measureWidthForWidthCalc = (fontSize, axes) => {
      this.styleApplier.applyFontSize(this.element, fontSize);
      this.styleApplier.applyAxisValues(this.element, axes);
      void this.element.offsetWidth;
      return this.measurer.measureWidth(this.element);
    };

    const optimalWidth = this.calculator.calculateOptimalWidth(
      containerWidth,
      measureWidthForWidthCalc,
      fontSize,
      {
        wght: initialAxes.wght,
        GRAD: initialAxes.GRAD,
        slnt: initialAxes.slnt,
        ROND: initialAxes.ROND
      }
    );

    // 7. Construir ejes finales
    const finalAxes = {
      wght: initialAxes.wght,
      GRAD: initialAxes.GRAD,
      wdth: optimalWidth,
      slnt: initialAxes.slnt,
      ROND: initialAxes.ROND
    };

    // 8. Verificar si necesita flex layout
    this.styleApplier.applyFontSize(this.element, fontSize);
    this.styleApplier.applyAxisValues(this.element, finalAxes);
    void this.element.offsetWidth; // Forzar reflow
    
    const finalTextWidth = this.measurer.measureWidth(this.element);
    const needsFlex = finalTextWidth < containerWidth * 0.98 && 
                     this.calculator.areAxesMaximized(finalAxes);

    // 9. Aplicar estilos finales
    this.currentAxes = finalAxes;
    this.currentFontSize = fontSize;
    this.flexEnabled = needsFlex;

    this.styleApplier.applyFontSize(this.element, fontSize);
    this.styleApplier.applyAxisValues(this.element, finalAxes);
  }

  /**
   * Actualiza FitText después de cambios (relevance, GUI, etc.)
   * @param {Object} options - Opciones de actualización { relevance, slnt, ROND, ... }
   */
  update(options = {}) {
    let needsRefit = false;

    if (typeof options.relevance === 'number') {
      const newRelevance = Math.max(0, Math.min(1, options.relevance));
      if (newRelevance !== this.options.relevance) {
        this.options.relevance = newRelevance;
        needsRefit = true;
      }
    }

    if (typeof options.slnt === 'number') {
      this.currentAxes.slnt = options.slnt;
      needsRefit = true;
    }

    if (typeof options.ROND === 'number') {
      this.currentAxes.ROND = options.ROND;
      needsRefit = true;
    }

    // Re-ejecutar ajuste solo si hubo cambios relevantes
    if (needsRefit) {
      this.fit();
    }
  }

  /**
   * Obtiene los valores actuales de los ejes
   * @returns {Object} Valores actuales de ejes
   */
  getAxes() {
    return { ...this.currentAxes };
  }

  /**
   * Obtiene el fontSize actual
   * @returns {number|null} FontSize actual
   */
  getFontSize() {
    return this.currentFontSize;
  }

  /**
   * Verifica si flex layout está activo
   * @returns {boolean} True si flex está habilitado
   */
  isFlexEnabled() {
    return this.flexEnabled;
  }

  /**
   * Limpia recursos y restaura el elemento a su estado original
   */
  destroy() {
    this.measurer.cleanup();
    this.styleApplier.clearStyles(this.element);
    this.element.innerHTML = '';
    this.charSpans = [];
  }
}

