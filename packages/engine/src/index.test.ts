import { describe, expect, it } from 'vitest';
import { GAME_TITLE, RULES_EDITION } from './index';

describe('engine package', () => {
  it('targets the 1961 edition', () => {
    expect(GAME_TITLE).toBe('D-Day');
    expect(RULES_EDITION).toBe(1961);
  });
});
