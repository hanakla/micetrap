/** Utils for minimizing bundle */

export const addListener = (
  target: EventTarget,
  type: string,
  listener: EventListener,
  options?: AddEventListenerOptions
) => {
  target.addEventListener(type, listener, options);
};

export const reduceToMap = <T, R extends object>(
  items: T[],
  callback: (acc: R, item: T, index: number) => void
) => {
  return items.reduce<R>(
    (acc, item, index) => (callback(acc, item, index), acc),
    {} as R
  );
};

export const fromCharCode = (code: number) => String.fromCharCode(code);

export const toArray = <T>(value: T | T[]): T[] =>
  Array.isArray(value) ? value : [value];

export const isMatchArray = <T>(a: T[], b: T[]) =>
  a.length === b.length && a.every((v, i) => v === b[i]);
