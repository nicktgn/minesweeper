export const debounce = <T extends unknown[]>(
  callback: (...args: T) => void,
  delay: number,
) => {
  let timeoutTimer: ReturnType<typeof setTimeout>;

  return (...args: T) => {
    clearTimeout(timeoutTimer);

    timeoutTimer = setTimeout(() => {
      callback(...args);
    }, delay);
  };
};

export function clamp(n: number, min = 0, max = 999) {
  return Math.max(min, Math.min(max, n))
}

export function padZeros(n: number, padding = 3) {
  return clamp(n).toString().padStart(padding, '0')
}
