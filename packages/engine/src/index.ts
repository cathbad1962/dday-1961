/**
 * Rules engine for Avalon Hill's D-Day (1961 edition).
 * Pure functions only: no I/O, no clocks, no unseeded randomness.
 */

export * from './board';
export * from './hex';
export * from './hexside';
export * from './map';

export const GAME_TITLE = 'D-Day';
export const RULES_EDITION = 1961;
