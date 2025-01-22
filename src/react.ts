import {
    RefObject,
    useEffect,
    useLayoutEffect,
    useMemo,
    useReducer,
    useRef,
} from "react";
import { Micetrap, MicetrapCallback, micetrap } from "./index";

export function useDocumentMicetrap(
    binds: { keys: string | string[]; callback: MicetrapCallback }[]
) {
    const mice = useRef<Micetrap | null>(null);
    const getBinds = useEffectCallback(() => binds);

    const ref = useKeyboardEvents<Document>((e) => {
        mice.current
            ?.getMatches(getBinds(), e)
            .forEach(({ callback, combo }) => callback(e, combo));
    });

    useLayoutEffect(() => {
        mice.current = micetrap([]);
        ref.current = document;

        return () => mice.current?.destroy();
    }, []);
}

export function useMicetrap(
    binds: { keys: string | string[]; callback: MicetrapCallback }[]
) {
    const ref = useRef<Micetrap | null>(null);

    useLayoutEffect(() => {
        ref.current = micetrap(binds);
        return () => ref.current?.destroy();
    }, []);

    return useKeyboardEvents((e) => {
        ref.current
            ?.getMatches(binds, e)
            .forEach(({ callback, combo }) => callback(e, combo));
    });
}

const useKeyboardEvents = <T extends Element | Document>(
    fn: (e: KeyboardEvent) => void
) => {
    const callback = useEffectCallback(fn);

    return useReactiveRef<T | null>(null, (ref) => {
        if (!ref) return;

        const abort = new AbortController();
        const signal = abort.signal;
        ref.addEventListener("keydown", callback, { signal });
        ref.addEventListener("keyup", callback, { signal });
        ref.addEventListener("keypress", callback, { signal });

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
        stableRef.current = function (
            this: any,
            ...args: any[]
        ): ReturnType<T> {
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
    const prefRef = useRef<T | null>(initial);
    const [, rerender] = useReducer((x) => x + 1, 0);

    useEffect(() => {
        if (ref.current === prefRef.current) return;
        prefRef.current = ref.current;
        return callback(ref.current);
    });

    return useMemo(
        () => ({
            get current() {
                return ref.current;
            },
            set current(value) {
                ref.current = value;
                rerender();
            },
        }),
        []
    );
}
