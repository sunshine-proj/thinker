import { assertNonNegative, assertPositive } from "../core";

/**
 * Shadows from straight-line light. A point lamp at distance a from an object of size s,
 * with the screen at distance D from the lamp, casts a shadow S = s·D/a (similar
 * triangles). A lamp of width w adds a fuzzy edge, the penumbra, of width w·(D − a)/a.
 *
 * Assumptions: the object and screen are parallel, and light travels in straight lines
 * (diffraction is far too small to see at these sizes).
 */

export function calculateShadowSize(objectSize: number, lampToObject: number, lampToScreen: number): number {
  assertPositive(objectSize, "objectSize");
  assertPositive(lampToObject, "lampToObject");
  if (lampToScreen <= lampToObject) {
    throw new RangeError("The screen must be farther from the lamp than the object.");
  }
  return (objectSize * lampToScreen) / lampToObject;
}

export function calculatePenumbraWidth(lampWidth: number, lampToObject: number, lampToScreen: number): number {
  assertNonNegative(lampWidth, "lampWidth");
  assertPositive(lampToObject, "lampToObject");
  if (lampToScreen < lampToObject) {
    throw new RangeError("The screen must be farther from the lamp than the object.");
  }
  return (lampWidth * (lampToScreen - lampToObject)) / lampToObject;
}

/** Lamp-to-object distance that gives a chosen shadow size. */
export function calculateLampDistanceForShadow(objectSize: number, shadowSize: number, lampToScreen: number): number {
  assertPositive(shadowSize, "shadowSize");
  return (objectSize * lampToScreen) / shadowSize;
}
