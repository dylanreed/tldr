import { parseTimeRange, ParsedTimeRange } from './time';

describe('parseTimeRange', () => {
  it('parses hours', () => {
    const result = parseTimeRange('24h');
    expect(result.success).toBe(true);
    expect((result as ParsedTimeRange).ms).toBe(24 * 60 * 60 * 1000);
  });

  it('parses days', () => {
    const result = parseTimeRange('7d');
    expect(result.success).toBe(true);
    expect((result as ParsedTimeRange).ms).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it('parses minutes', () => {
    const result = parseTimeRange('30m');
    expect(result.success).toBe(true);
    expect((result as ParsedTimeRange).ms).toBe(30 * 60 * 1000);
  });

  it('parses weeks', () => {
    const result = parseTimeRange('2w');
    expect(result.success).toBe(true);
    expect((result as ParsedTimeRange).ms).toBe(2 * 7 * 24 * 60 * 60 * 1000);
  });

  it('returns error for invalid format', () => {
    const result = parseTimeRange('banana');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Invalid format. Use like `24h`, `3d`, `1w`');
    }
  });

  it('returns error for zero duration', () => {
    const result = parseTimeRange('0h');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Duration must be greater than 0');
    }
  });

  it('formats duration as human readable', () => {
    const result = parseTimeRange('24h');
    expect(result.success).toBe(true);
    expect((result as ParsedTimeRange).humanReadable).toBe('24 hours');
  });
});
