import {
    BindOption,
    defaultShouldStopCallback,
    matchCombo,
    MicetrapCallback,
    ShouldStopCallback,
} from "./core";

export type { MicetrapCallback, ShouldStopCallback };

type MicetrapBind = { keys: string | string[]; callback: MicetrapCallback };

export type Micetrap = {
    getMatches: (
        bindMap: Array<MicetrapBind>,
        e: KeyboardEvent
    ) => Array<MicetrapBind & { combo: string }>;
    destroy: () => void;
};

export function micetrap(
    binds: Array<MicetrapBind> = [],
    target: HTMLElement | Document = typeof window !== "undefined"
        ? window.document
        : (null as any),
    {
        sequenceTimeout = 1000,
        stopCallback = defaultShouldStopCallback,
        ...options
    }: BindOption & {
        sequenceTimeout?: number;
        stopCallback?: ShouldStopCallback;
    } = {}
): Micetrap {
    const abort = new AbortController();
    const signal = AbortSignal.any(
        [abort.signal, options.signal].filter((s) => !!s)
    );

    let sequenceState: string[] = [];
    let sequenceTimer: number | null = null;

    const handleKeyEvent = (e: KeyboardEvent) => {
        if (stopCallback(e, e.target as HTMLElement, target)) return;

        for (const bind of binds) {
            const match = matchCombo(
                bind.keys,
                e,
                sequenceState.length,
                options
            );

            if (!match) continue;

            if (match.complete) {
                bind.callback(e, bind.keys as string);
                sequenceState = [];
            } else {
                sequenceState.push(match.combo);
                if (sequenceTimer) clearTimeout(sequenceTimer);
            }

            sequenceTimer = window.setTimeout(() => {
                sequenceState = [];
            }, sequenceTimeout);
        }
    };

    target.addEventListener("keydown", handleKeyEvent, { signal });
    target.addEventListener("keyup", handleKeyEvent, { signal });
    target.addEventListener("keypress", handleKeyEvent, { signal });

    const ret: Micetrap = {
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

// micetrap([{ keys: "meta+s", callback: (e) => console.log(e) }]);
