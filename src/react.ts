import { useEffect, useLayoutEffect, useMemo, useReducer, useRef } from "react";
import { Micetrap, micetrap, MicetrapOption } from "./index";
import type { MicetrapBind } from "./types";
import { addListener } from "./utils";

export function useDocumentMicetrap(binds: MicetrapBind[]) {
  const mice = useMemo(() => micetrap(), []);
  const getBinds = useEffectCallback(() => binds);

  const ref = useKeyboardEvents((e) => {
    mice.handleEvent(e, getBinds());
  });

  useEffect(() => {
    ref.current = document;
    return () => mice.destroy();
  }, []);

  return mice;
}

export function useMicetrap<T extends Element>(
  binds: MicetrapBind[],
  options?: MicetrapOption
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

  const ref = useKeyboardEvents<T | null>((e) => {
    mice.handleEvent(e, getBinds());
  });

  useEffect(() => {
    const prev = mice;
    return () => prev.destroy();
  }, [mice]);

  return [ref, mice];
}

const useKeyboardEvents = <T extends Element | Document | null>(
  fn: (e: KeyboardEvent) => void
) => {
  const callback = useEffectCallback(fn);

  return useReactiveRef<T | null>(null, (ref) => {
    if (!ref) return;

    const abort = new AbortController();
    const signal = abort.signal;

    addListener(ref, "keydown", callback, { signal });
    addListener(ref, "keyup", callback, { signal });
    addListener(ref, "keypress", callback, { signal });

    return () => abort.abort();
  });
};

const useEffectCallback = <T extends (...args: any[]) => any>(cb: T) => {
  const stableRef = useRef<T | null>(null);
  const latestRef = useRef<T | null>(null);

  useLayoutEffect(() => {
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
  callback: (ref: T | null) => void | (() => void)
): ReactiveRefObject<T | null> {
  const ref = useRef<T | null>(initial);
  const [c, rerender] = useReducer((x) => x + 1, 0);

  useLayoutEffect(() => callback(ref.current), [c]);

  return useMemo(
    () => ({
      get current() {
        return ref.current;
      },
      set current(value) {
        const current = ref.current;
        ref.current = value;
        if (current !== value) rerender();
      },
    }),
    []
  );
}
