/**
 * VariableFontStrategy - Base class for font-specific axis logic
 * Responsibility: Define how to calculate and apply axes for a specific variable font
 */
export default class VariableFontStrategy {
  constructor() {
    if (this.constructor === VariableFontStrategy) {
      throw new Error("VariableFontStrategy is abstract and cannot be instantiated directly.");
    }
    this.axisRanges = {};
  }

  /**
   * Returns initial axes values based on relevance
   * @param {number} relevance - 0 to 1
   * @returns {Object} Initial axis values
   */
  getInitialAxes(relevance) {
    throw new Error("Method 'getInitialAxes' must be implemented.");
  }

  /**
   * Calculates next axes values when text overflows
   * @param {Object} currentAxes - Current axis values
   * @param {number} overflowRatio - Ratio of overflow (e.g. 1.1 for 10% overflow)
   * @returns {Object} Adjusted axis values
   */
  calculateNextAxes(currentAxes, overflowRatio) {
    throw new Error("Method 'calculateNextAxes' must be implemented.");
  }

  /**
   * Generates axes for a specific character based on its index and noise
   * @param {number} index - Character index
   * @param {Object} baseAxes - Base axis values
   * @param {Object} noiseParams - Intensity and speed factors
   * @returns {Object} Varied axis values
   */
  getCharacterAxes(index, baseAxes, noiseParams = {}) {
    throw new Error("Method 'getCharacterAxes' must be implemented.");
  }

  /**
   * Converts axes object to font-variation-settings string
   * @param {Object} axes - Axis values
   * @returns {string} CSS font-variation-settings value
   */
  getAxesString(axes) {
    return Object.entries(axes)
      .map(([tag, value]) => `"${tag}" ${value}`)
      .join(', ');
  }

  /**
   * Returns definition of available axes
   * @returns {Object} Axis ranges and defaults
   */
  getAxisRanges() {
    return this.axisRanges;
  }

  /**
   * Clamps a value between min and max
   */
  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }
}
