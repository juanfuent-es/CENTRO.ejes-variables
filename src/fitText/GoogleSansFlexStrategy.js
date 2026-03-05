import VariableFontStrategy from './VariableFontStrategy.js';

/**
 * GoogleSansFlexStrategy - Specific implementation for Google Sans Flex
 */
export default class GoogleSansFlexStrategy extends VariableFontStrategy {
  constructor() {
    super();
    this.axisRanges = {
      wght: { min: 1, max: 1000, default: 400 },
      wdth: { min: 25, max: 151, default: 100 },
      opsz: { min: 6, max: 144, default: 14 },
      slnt: { min: -10, max: 0, default: 0 },
      GRAD: { min: 0, max: 100, default: 0 },
      ROND: { min: 0, max: 100, default: 0 }
    };
  }

  getInitialAxes(relevance) {
    const r = this.clamp(relevance, 0, 1);
    return {
      wght: Math.round(this.axisRanges.wght.min + (this.axisRanges.wght.max - this.axisRanges.wght.min) * r),
      GRAD: Math.round(this.axisRanges.GRAD.min + (this.axisRanges.GRAD.max - this.axisRanges.GRAD.min) * r),
      wdth: this.axisRanges.wdth.default,
      slnt: this.axisRanges.slnt.default,
      ROND: this.axisRanges.ROND.default,
      opsz: this.axisRanges.opsz.default
    };
  }

  /**
   * Adaptation logic: when overflowing, first reduce width, then weight/grade
   */
  calculateNextAxes(currentAxes, overflowRatio) {
    const nextAxes = { ...currentAxes };
    const overflowFactor = Math.min(1.2, overflowRatio);

    // 1. Reduce Width (Highest impact on "fitting")
    if (nextAxes.wdth > this.axisRanges.wdth.min) {
      const wdthStep = Math.max(5, (nextAxes.wdth - this.axisRanges.wdth.min) * 0.2 * overflowFactor);
      nextAxes.wdth = this.clamp(nextAxes.wdth - wdthStep, this.axisRanges.wdth.min, this.axisRanges.wdth.max);
      return nextAxes; // Return early to let FitText re-measure
    }

    // 2. Reduce Weight
    if (nextAxes.wght > this.axisRanges.wght.min) {
      const wghtStep = Math.max(20, (nextAxes.wght - this.axisRanges.wght.min) * 0.15 * overflowFactor);
      nextAxes.wght = this.clamp(nextAxes.wght - wghtStep, this.axisRanges.wght.min, this.axisRanges.wght.max);
    }

    // 3. Reduce Grade
    if (nextAxes.GRAD > this.axisRanges.GRAD.min) {
      const gradStep = Math.max(10, (nextAxes.GRAD - this.axisRanges.GRAD.min) * 0.15 * overflowFactor);
      nextAxes.GRAD = this.clamp(nextAxes.GRAD - gradStep, this.axisRanges.GRAD.min, this.axisRanges.GRAD.max);
    }

    return nextAxes;
  }

  /**
   * Per-character variation using a sine-based pseudo-noise
   */
  getCharacterAxes(index, baseAxes, noiseParams = {}) {
    const intensity = noiseParams.intensity ?? 0.5; // 0 to 1
    const seed = noiseParams.seed ?? 0;
    
    // Varying three axes: wdth, wght, GRAD
    const variedAxes = { ...baseAxes };

    // Simple pseudo-noise based on index and seed
    const getNoise = (offset) => Math.sin(index * 0.5 + seed + offset) * 0.5 + 0.5;

    if (intensity > 0) {
      // Vary Width
      const wdthRange = this.axisRanges.wdth;
      const wdthSpan = (wdthRange.max - wdthRange.min) * 0.3 * intensity;
      variedAxes.wdth = this.clamp(baseAxes.wdth + (getNoise(0) - 0.5) * wdthSpan * 2, wdthRange.min, wdthRange.max);

      // Vary Weight
      const wghtRange = this.axisRanges.wght;
      const wghtSpan = (wghtRange.max - wghtRange.min) * 0.2 * intensity;
      variedAxes.wght = this.clamp(baseAxes.wght + (getNoise(1.5) - 0.5) * wghtSpan * 2, wghtRange.min, wghtRange.max);

      // Vary Grade
      const gradRange = this.axisRanges.GRAD;
      const gradSpan = (gradRange.max - gradRange.min) * 0.5 * intensity;
      variedAxes.GRAD = this.clamp(baseAxes.GRAD + (getNoise(3.0) - 0.5) * gradSpan * 2, gradRange.min, gradRange.max);
    }

    return variedAxes;
  }
}
