/**
 * StyleApplier - Aplicación de estilos CSS a elementos y spans
 * Responsabilidad: Aplicar valores de ejes como CSS variables, fontSize, y flex layout
 */

export default class StyleApplier {
  constructor(fontFamily = 'Google Sans Flex, sans-serif') {
    this.fontFamily = fontFamily;
    this.flexClassName = 'fit-text-flex';
  }

  /**
   * Aplica valores de ejes como CSS variables al contenedor
   * @param {HTMLElement} container - Elemento contenedor
   * @param {Object} axes - Valores de ejes { wght, GRAD, wdth, slnt, ROND }
   */
  applyAxisValues(container, axes = {}) {
    if (!container) return;

    // Apply specific CSS variables for each axis provided
    Object.entries(axes).forEach(([tag, value]) => {
      if (typeof value === 'number') {
        container.style.setProperty(`--${tag}`, value);
      }
    });

    // Also apply font-variation-settings for broader compatibility
    const variationString = Object.entries(axes)
      .map(([tag, value]) => `"${tag}" ${value}`)
      .join(', ');
    
    if (variationString) {
      container.style.fontVariationSettings = variationString;
    }

    // Asegurar que la familia de fuente esté aplicada
    container.style.fontFamily = this.fontFamily;
  }

  /**
   * Aplica fontSize al contenedor
   * @param {HTMLElement} container - Elemento contenedor
   * @param {number} size - Tamaño de fuente en px
   */
  applyFontSize(container, size) {
    if (!container || typeof size !== 'number' || size <= 0) return;
    container.style.fontSize = `${size}px`;
  }

  /**
   * Limpia todos los estilos aplicados
   * @param {HTMLElement} container - Elemento contenedor
   */
  clearStyles(container) {
    if (!container) return;

    container.style.fontSize = '';
    container.style.fontVariationSettings = '';
    
    // Clear common variables
    ['wght', 'GRAD', 'wdth', 'slnt', 'ROND', 'opsz'].forEach(tag => {
      container.style.setProperty(`--${tag}`, '');
    });

    if (container._originalStyles) {
      delete container._originalStyles;
    }
  }
}

