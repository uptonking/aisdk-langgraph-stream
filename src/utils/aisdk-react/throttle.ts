import throttleFunction from 'throttleit';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  waitMs: number | undefined,
): T {
  return waitMs != null ? throttleFunction(fn, waitMs) : fn;
}
