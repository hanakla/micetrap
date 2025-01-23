/** Utils for minimizing bundle */

export const addListener = (
  target: EventTarget,
  type: string,
  listener: EventListener,
  options?: AddEventListenerOptions
) => {
  target.addEventListener(type, listener, options);
};

export const timesReduce = <T>(
  times: number,
  callback: (index: number, acc: T) => T,
  acc: T
) => {
  return [...Array(times)].reduce<T>(
    (acc, _, index) => callback(index, acc),
    acc
  );
};

export const fromCharCode = (code: number) => String.fromCharCode(code);
