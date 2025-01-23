export const createAbortController = () => new AbortController();

export const addListener = (
  target: EventTarget,
  type: string,
  listener: EventListener,
  options?: AddEventListenerOptions
) => {
  target.addEventListener(type, listener, options);
};
