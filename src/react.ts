import {
  RefObject,
  useEffect,
  useInsertionEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
import { Micetrap, micetrap, MicetrapOption } from "./index";
import type { MicetrapBind } from "./types";
import { addListener } from "./utils";

export function useDocumentMicetrap(binds: MicetrapBind[]) {
  const mice = useMemo(() => micetrap(), []);
  const getBinds = useEffectCallback(() => binds);

  const ref = useKeyboardEvents((e) => {
    mice.handleEvent(e, getBinds());
  }, null);

  useEffect(() => {
    ref.current = document;
    return () => mice.destroy();
  }, []);

  return mice;
}

export function useMicetrap<T extends Element>(
  binds: MicetrapBind[],
  options?: MicetrapOption | null,
  inputRef?: RefObject<T | null> | null
): [ReactiveRefObject<T | null>, Micetrap] {
  const mice = useMemo(
    () =>
      micetrap(null, {
        stopPropagation: true,
        ...options,
      }),
    [
      options?.sequenceTimeout,
      options?.stopCallback,
      options?.stopPropagation,
      options?.signal,
    ]
  );
  const getBinds = useEffectCallback(() => binds);

  const internalRef = useKeyboardEvents<T | null>((e) => {
    mice.handleEvent(e, getBinds());
  }, inputRef);

  useEffect(() => {
    const prev = mice;
    return () => prev.destroy();
  }, [mice]);

  return [internalRef, mice];
}

const useKeyboardEvents = <T extends Element | Document | null>(
  fn: (e: KeyboardEvent) => void,
  inputRef: RefObject<T | null> | null | undefined
) => {
  const callback = useEffectCallback(fn);

  const mount = useEffectCallback((ref: T | null) => {
    if (!ref) return;

    const abort = new AbortController();
    const signal = abort.signal;

    addListener(ref, "keydown", callback, { signal });
    addListener(ref, "keyup", callback, { signal });
    addListener(ref, "keypress", callback, { signal });

    return () => abort.abort();
  });

  useEffect(() => {
    if (!inputRef) return;
    return mount(inputRef?.current);
  }, [inputRef]);

  return useReactiveRef<T | null>(null, inputRef, (ref) => {
    if (inputRef) return;
    return mount(ref);
  });
};

const useEffectCallback = <T extends (...args: any[]) => any>(cb: T) => {
  const stableRef = useRef<T | null>(null);
  const latestRef = useRef<T | null>(null);

  useInsertionEffect(() => {
    latestRef.current = cb;
  }, [cb]);

  if (stableRef.current == null) {
    stableRef.current = function (this: any, ...args: any[]): ReturnType<T> {
      return latestRef.current?.apply(this, args);
    } as T;
  }

  return stableRef.current;
};

type ReactiveRefObject<T> = {
  current: T | null;
};

function useReactiveRef<T>(
  initial: T,
  inputRef: RefObject<T | null> | null | undefined,
  callback: (ref: T | null) => void | (() => void)
): ReactiveRefObject<T | null> {
  const ref = useRef<T | null>(initial);
  const usingRef = inputRef ?? ref;
  const [c, rerender] = useReducer((x) => x + 1, 0);

  useEffect(() => callback(usingRef.current), [c]);

  return useMemo(
    () => ({
      get current() {
        return ref.current;
      },
      set current(value) {
        const prev = ref.current;
        ref.current = value;
        if (inputRef) inputRef.current = value;
        if (prev !== value) rerender();
      },
    }),
    []
  );
}
