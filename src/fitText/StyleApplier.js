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

    // Aplicar variables CSS individuales
    if (typeof axes.wght === 'number') {
      container.style.setProperty('--font-variation-wght', axes.wght);
    }
    if (typeof axes.GRAD === 'number') {
      container.style.setProperty('--font-variation-GRAD', axes.GRAD);
    }
    if (typeof axes.wdth === 'number') {
      container.style.setProperty('--font-variation-wdth', axes.wdth);
    }
    if (typeof axes.slnt === 'number') {
      container.style.setProperty('--font-variation-slnt', axes.slnt);
    }
    if (typeof axes.ROND === 'number') {
      container.style.setProperty('--font-variation-ROND', axes.ROND);
    }

    // Aplicar font-variation-settings completo
    const variationSettings = this.buildFontVariationSettings(axes);
    container.style.fontVariationSettings = variationSettings;
    
    // Asegurar que la familia de fuente esté aplicada
    container.style.fontFamily = this.fontFamily;
  }

  /**
   * Construye la cadena font-variation-settings
   * @param {Object} axes - Valores de ejes
   * @returns {string} Cadena CSS para font-variation-settings
   */
  buildFontVariationSettings(axes = {}) {
    const settings = [];

    // Orden específico para Google Sans Flex: opsz, slnt, wdth, wght, GRAD, ROND
    // opsz es automático, pero podemos incluirlo si se proporciona
    if (typeof axes.opsz === 'number') {
      settings.push(`'opsz' ${axes.opsz}`);
    }

    if (typeof axes.slnt === 'number') {
      settings.push(`'slnt' ${axes.slnt}`);
    }

    if (typeof axes.wdth === 'number') {
      settings.push(`'wdth' ${axes.wdth}`);
    }

    if (typeof axes.wght === 'number') {
      settings.push(`'wght' ${axes.wght}`);
    }

    if (typeof axes.GRAD === 'number') {
      settings.push(`'GRAD' ${axes.GRAD}`);
    }

    if (typeof axes.ROND === 'number') {
      settings.push(`'ROND' ${axes.ROND}`);
    }

    return settings.length > 0 ? settings.join(', ') : 'normal';
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
   * Aplica o remueve flex layout al contenedor
   * @param {HTMLElement} container - Elemento contenedor
   * @param {boolean} enabled - Si debe estar habilitado
   */
  applyFlexLayout(container, enabled) {
    if (!container) return;

    if (enabled) {
      container.classList.add(this.flexClassName);
      container.style.display = 'flex';
      container.style.justifyContent = 'space-between';
      container.style.width = '100%';
      container.style.alignItems = 'center';
    } else {
      container.classList.remove(this.flexClassName);
      container.style.display = '';
      container.style.justifyContent = '';
      container.style.width = '';
      container.style.alignItems = '';
    }
  }

  /**
   * Limpia todos los estilos aplicados
   * @param {HTMLElement} container - Elemento contenedor
   */
  clearStyles(container) {
    if (!container) return;

    container.style.fontSize = '';
    container.style.fontVariationSettings = '';
    container.style.setProperty('--font-variation-wght', '');
    container.style.setProperty('--font-variation-GRAD', '');
    container.style.setProperty('--font-variation-wdth', '');
    container.style.setProperty('--font-variation-slnt', '');
    container.style.setProperty('--font-variation-ROND', '');
    this.applyFlexLayout(container, false);

    if (container._originalStyles) {
      delete container._originalStyles;
    }
  }
}

