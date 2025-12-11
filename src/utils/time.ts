export interface ParsedTimeRange {
  success: true;
  ms: number;
  humanReadable: string;
}

export interface ParseError {
  success: false;
  error: string;
}

export type TimeRangeResult = ParsedTimeRange | ParseError;

const UNITS: Record<string, { ms: number; singular: string; plural: string }> = {
  m: { ms: 60 * 1000, singular: 'minute', plural: 'minutes' },
  h: { ms: 60 * 60 * 1000, singular: 'hour', plural: 'hours' },
  d: { ms: 24 * 60 * 60 * 1000, singular: 'day', plural: 'days' },
  w: { ms: 7 * 24 * 60 * 60 * 1000, singular: 'week', plural: 'weeks' },
};

export function parseTimeRange(input: string): TimeRangeResult {
  const match = input.toLowerCase().match(/^(\d+)([mhdw])$/);

  if (!match) {
    return {
      success: false,
      error: 'Invalid format. Use like `24h`, `3d`, `1w`',
    };
  }

  const amount = parseInt(match[1], 10);
  const unit = match[2];

  if (amount === 0) {
    return {
      success: false,
      error: 'Duration must be greater than 0',
    };
  }

  const unitInfo = UNITS[unit];
  const ms = amount * unitInfo.ms;
  const label = amount === 1 ? unitInfo.singular : unitInfo.plural;

  return {
    success: true,
    ms,
    humanReadable: `${amount} ${label}`,
  };
}
