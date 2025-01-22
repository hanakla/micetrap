import { RefObject, useLayoutEffect, useMemo, useReducer, useRef } from "react";
import { micetrap, MicetrapOption } from "./index";
import { MicetrapBind } from "./core";

export function useDocumentMicetrap(binds: MicetrapBind[]) {
  const getBinds = useEffectCallback(() => binds);

  useLayoutEffect(() => {
    const mice = micetrap(getBinds, document);
    return () => mice.destroy();
  }, []);
}

export function useMicetrap<T extends Element>(
  binds: MicetrapBind[],
  options?: MicetrapOption
) {
  const getBinds = useEffectCallback(() => binds);

  const ref = useReactiveRef<T | null>(null, (ref) => {
    const mice = micetrap(getBinds(), ref, options);
    return () => mice.destroy();
  });

  return ref;
}

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

function useReactiveRef<T>(
  initial: T,
  callback: (ref: T | null) => void | (() => void)
): RefObject<T | null> {
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
