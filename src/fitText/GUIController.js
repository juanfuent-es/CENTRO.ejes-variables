/**
 * GUIController - Integración con lil.gui para controlar ejes slant y roundness
 * Responsabilidad: Crear y gestionar controles GUI para ejes que el usuario puede ajustar
 */

export class GUIController {
  constructor(guiInstance, options = {}) {
    if (!guiInstance) {
      console.warn('GUIController: se requiere una instancia de lil.GUI');
      return;
    }

    this.gui = guiInstance;
    this.fitTextInstance = options.fitTextInstance || null;
    this.onUpdateCallback = options.onUpdate || null;
    this.values = {};
    this.controllers = {};

    // Crear controles GUI
    this.createControls();
  }

  /**
   * Crea los controles GUI para todos los ejes de la estrategia
   */
  createControls() {
    if (!this.fitTextInstance || !this.fitTextInstance.strategy) return;

    const strategy = this.fitTextInstance.strategy;
    const ranges = strategy.getAxisRanges();
    const currentAxes = this.fitTextInstance.getAxes();
    const options = this.fitTextInstance.options;

    const fontFolder = this.gui.addFolder('Fuente Variable');
    fontFolder.open();

    this.controllers = {};
    this.values = { 
      ...currentAxes,
      noiseIntensity: options.noiseIntensity,
      noiseSeed: options.noiseSeed
    };

    Object.entries(ranges).forEach(([tag, range]) => {
      const controller = fontFolder
        .add(this.values, tag, range.min, range.max, tag === 'wght' ? 1 : 0.1)
        .name(tag.toUpperCase())
        .onChange(value => {
          this.values[tag] = value;
          this.handleChange();
        });
      
      this.controllers[tag] = controller;
    });

    const noiseFolder = this.gui.addFolder('Configuración Noise');
    noiseFolder.open();

    noiseFolder.add(this.values, 'noiseIntensity', 0, 1, 0.01)
      .name('Intensidad Ruido')
      .onChange(value => {
        this.values.noiseIntensity = value;
        this.handleChange();
      });

    noiseFolder.add(this.values, 'noiseSeed', 0, 10, 0.01)
      .name('Seed / Time')
      .onChange(value => {
        this.values.noiseSeed = value;
        this.handleChange();
      });
  }

  /**
   * Maneja cambios en los controles GUI
   */
  handleChange() {
    if (this.fitTextInstance) {
      this.fitTextInstance.update(this.values);
    }

    if (this.onUpdateCallback) {
      this.onUpdateCallback(this.values);
    }
  }

  /**
   * Establece la instancia de FitText para actualización automática
   * @param {FitText} fitTextInstance - Instancia de FitText
   */
  setFitTextInstance(fitTextInstance) {
    this.fitTextInstance = fitTextInstance;
  }

  /**
   * Establece callback personalizado para cambios
   * @param {Function} callback - Función callback
   */
  setOnUpdate(callback) {
    this.onUpdateCallback = callback;
  }

  /**
   * Obtiene los valores actuales
   * @returns {Object} Valores actuales { slnt, ROND }
   */
  getValues() {
    return { ...this.values };
  }

  /**
   * Establece valores programáticamente
   * @param {Object} values - Nuevos valores { slnt, ROND }
   */
  setValues(values) {
    if (typeof values.slnt === 'number') {
      this.values.slnt = this.clamp(values.slnt, this.ranges.slnt.min, this.ranges.slnt.max);
      if (this.controllers.slnt) {
        this.controllers.slnt.setValue(this.values.slnt);
      }
    }

    if (typeof values.ROND === 'number') {
      this.values.ROND = this.clamp(values.ROND, this.ranges.ROND.min, this.ranges.ROND.max);
      if (this.controllers.ROND) {
        this.controllers.ROND.setValue(this.values.ROND);
      }
    }

    this.handleChange();
  }

  /**
   * Limita un valor entre min y max
   * @param {number} value - Valor a limitar
   * @param {number} min - Valor mínimo
   * @param {number} max - Valor máximo
   * @returns {number} Valor limitado
   */
  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * Destruye los controles GUI
   */
  destroy() {
    if (this.controllers) {
      Object.values(this.controllers).forEach(controller => {
        if (controller && controller.destroy) {
          controller.destroy();
        }
      });
    }
    this.fitTextInstance = null;
    this.onUpdateCallback = null;
  }
}

