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
    this.strategy = options.strategy;
    if (!this.strategy) {
      throw new Error('FitText: se requiere una estrategia de fuente variable (VariableFontStrategy)');
    }

    this.options = {
      fontFamily: options.fontFamily || 'Google Sans Flex, sans-serif',
      relevance: this.parseRelevance(element, options.relevance),
      lineHeightRatio: options.lineHeightRatio || 1,
      minFontSize: options.minFontSize || 14,
      maxFontSize: options.maxFontSize || 1000,
      noiseIntensity: options.noiseIntensity ?? 0.5,
      noiseSeed: options.noiseSeed ?? 0,
      fixedFontSize: options.fixedFontSize ?? true,
      ...options
    };

    // Inicializar componentes
    this.measurer = new TextMeasurer();
    this.calculator = new AxisCalculator(this.strategy, {
      lineHeightRatio: this.options.lineHeightRatio,
      minFontSize: this.options.minFontSize,
      maxFontSize: this.options.maxFontSize
    });
    this.styleApplier = new StyleApplier(this.options.fontFamily);

    // Estado interno
    this.charSpans = [];
    this.currentAxes = this.strategy.getInitialAxes(this.options.relevance);
    this.currentFontSize = null;
    this.flexEnabled = false;

    // Renderizar texto como spans desde el inicio
    const text = this.extractText(element);
    this.renderAsSpans(text);

    // Aplicar estilos base e iniciales
    this.styleApplier.applyAxisValues(this.element, this.currentAxes);
  }

  /**
   * Extrae el texto del elemento, preservando espacios y saltos de línea
   * @param {HTMLElement} element - Elemento HTML
   * @returns {string} Texto extraído
   */
  extractText(element) {
    const text = element.textContent || element.innerText || '';
    // Normalizar espacios: quitar espacios al inicio/final y colapsar múltiples espacios/saltos en uno solo
    return text.trim().replace(/\s+/g, ' ');
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
    const parentContainer = this.element.parentElement || this.element;
    const parentRect = parentContainer.getBoundingClientRect();
    const computedStyle = getComputedStyle(this.element); // Medir el elemento mismo para el font-size original
    
    // Si fixedFontSize es true, usamos el tamaño actual o el de opciones
    let fontSize = this.options.fixedFontSize ? 
                   parseFloat(computedStyle.fontSize) : 
                   this.currentFontSize || parseFloat(computedStyle.fontSize);

    // Ajustes de contenedor (solo para referencia si se desborda, aunque ya no escalamos fontSize)
    const containerWidth = parentRect.width; 

    // 1. Base axes from relevance + overrides
    let baseAxes = { ...this.strategy.getInitialAxes(this.options.relevance), ...this.currentAxes };

    // 2. Apply per-character axes
    this.charSpans.forEach((span, index) => {
      const charAxes = this.strategy.getCharacterAxes(index, baseAxes, {
        intensity: this.options.noiseIntensity,
        seed: this.options.noiseSeed
      });
      
      this.styleApplier.applyAxisValues(span, charAxes);
    });

    // 3. Apply base font size if not scaled
    this.styleApplier.applyFontSize(this.element, fontSize);
    
    this.currentFontSize = fontSize;
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

    if (typeof options.noiseIntensity === 'number') {
      this.options.noiseIntensity = options.noiseIntensity;
      needsRefit = true;
    }

    if (typeof options.noiseSeed === 'number') {
      this.options.noiseSeed = options.noiseSeed;
      needsRefit = true;
    }

    // Update any axis provided that is valid for this strategy
    const ranges = this.strategy.getAxisRanges();
    Object.keys(options).forEach(tag => {
      if (ranges[tag] && typeof options[tag] === 'number') {
        this.currentAxes[tag] = options[tag];
        needsRefit = true;
      }
    });

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

