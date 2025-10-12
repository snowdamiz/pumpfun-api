/**
 * Basic test to verify Jest configuration
 */

describe('Jest Configuration', () => {
  test('should have Jest properly configured', () => {
    expect(true).toBe(true);
    expect(typeof jest).toBe('object');
  });

  test('should support TypeScript', () => {
    const message: string = 'Hello TypeScript';
    expect(message).toBe('Hello TypeScript');
  });

  test('should support custom matchers', () => {
    expect('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM').toBeValidSolanaAddress();
    expect('https://example.com').toBeValidURL();
    expect(42).toBeWithinRange(1, 100);
  });

  test('should support async operations', async () => {
    const result = await Promise.resolve('async test');
    expect(result).toBe('async test');
  });
});
