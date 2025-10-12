/**
 * Placeholder for error handling classes
 * This will be implemented in T012
 */

export class PumpFunError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PumpFunError';
  }
}
