import {
    BindOption,
    defaultShouldStopCallback,
    matchCombo,
    MicetrapBind,
    MicetrapCallback,
    ShouldStopCallback,
} from "./core";

export type { MicetrapCallback, ShouldStopCallback };

export type Micetrap = {
    /** Shortcut match inspection hook */
    hook: ((matches: Array<MatchResult>) => void) | null;
    /** Resume listening for keyboard events */
    resume: () => void;
    /** Pause listening for keyboard events */
    pause: () => void;
    /** Get matched bindings for a specific event */
    getMatches: (
        bindMap: Array<MicetrapBind>,
        e: KeyboardEvent
    ) => Array<MicetrapBind & { combo: string }>;
    /** Destroy the instance */
    destroy: () => void;
};

type MatchResult = { bind: MicetrapBind; complete: boolean; combo: string };

export type MicetrapOption = BindOption & {
    /** Timeout for sequence reset */
    sequenceTimeout?: number;
    /** Callback to determine if the event should be stopped */
    stopCallback?: ShouldStopCallback;
};

export function micetrap(
    binds: Array<MicetrapBind> | (() => Array<MicetrapBind>) = [],
    target: Element | Document | null = typeof window !== "undefined"
        ? window.document
        : null,
    {
        sequenceTimeout = 1000,
        stopCallback = defaultShouldStopCallback,
        ...options
    }: MicetrapOption = {}
): Micetrap {
    const abort = new AbortController();
    const signal = AbortSignal.any(
        [abort.signal, options.signal].filter((s) => !!s)
    );

    let paused = false;
    let sequenceState: string[] = [];
    let sequenceTimer: number | null = null;

    const handleKeyEvent = (e: KeyboardEvent) => {
        if (paused || stopCallback(e, e.target as Element, target!)) return;

        const _binds = typeof binds === "function" ? binds() : binds;

        let matches: MatchResult[] = [];
        for (const bind of _binds) {
            const match = matchCombo(
                bind.keys,
                e,
                sequenceState.length,
                options
            );

            if (!match) continue;

            matches.push({ ...match, bind });

            if (match.complete) {
                bind.handler(e, bind.keys as string);
                sequenceState = [];
            } else {
                sequenceState.push(match.combo);
            }

            if (sequenceTimer) clearTimeout(sequenceTimer);

            sequenceTimer = window.setTimeout(() => {
                sequenceState = [];
            }, sequenceTimeout);
        }

        if (matches.length) ret.hook?.(matches);
    };

    if (target) {
        target.addEventListener("keydown", handleKeyEvent, { signal });
        target.addEventListener("keyup", handleKeyEvent, { signal });
        target.addEventListener("keypress", handleKeyEvent, { signal });
    }

    const ret: Micetrap = {
        hook: null,
        resume: () => {
            paused = false;
        },
        pause: () => {
            paused = true;
        },
        getMatches(bindMap: Array<MicetrapBind>, e: KeyboardEvent) {
            return bindMap
                .map((bind) => {
                    const result = matchCombo(
                        bind.keys,
                        e,
                        sequenceState.length,
                        options
                    );

                    if (!result || !result.complete) return false;

                    return { ...bind, combo: result.combo };
                })
                .filter((v) => !!v);
        },
        destroy() {
            abort.abort();
        },
    };

    return ret;
}
