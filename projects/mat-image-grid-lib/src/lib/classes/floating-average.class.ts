/**
 * Calculate the floating average of the entries in a moving window.
 * The width of the window can be defined while creating an instance of this class.
 * All values to inspect are numbers.
 * @class FloatingAverage
 */
export class FloatingAverage {
  private entries: number[] = [];
  private widthOfWindow = 0;
  private currentAverage: number;

  /**
   * Creates an instance of FloatingAverage.
   * @param entriesInWindow - number of entries in window
   * @param initialAverage - initial value for average (if no entries received)
   */
  constructor(entriesInWindow: number, initialAverage: number) {
    this.widthOfWindow = entriesInWindow;
    this.currentAverage = initialAverage;
    this.entries.push(initialAverage);
  }

  /**
   * Add new value to the window and remove oldest value if window
   * has reached maximum number of values.
   * @param value - new value to add
   */
  addEntry(value: number) {
    this.entries.push(value);
    if (this.entries.length > this.widthOfWindow) {
      const droppedEntry = this.entries.shift() || 0;
      this.currentAverage =
        this.currentAverage + (value - droppedEntry) / this.widthOfWindow;
    } else {
      const newLength = this.entries.length;
      this.currentAverage =
        this.currentAverage * ((newLength - 1) / newLength) + value / newLength;
    }
  }

  /**
   * Get average of entries in window.
   * @returns average of values in window
   */
  public get average(): number {
    return this.currentAverage;
  }
}
