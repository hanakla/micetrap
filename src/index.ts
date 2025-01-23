import {
  defaultShouldStopCallback,
  matchCombo,
  MicetrapBind,
  MicetrapCallback,
  ShouldStopCallback,
  StringMap,
} from "./core";
import { addListener } from "./utils";

export type { MicetrapCallback, ShouldStopCallback };

export type Micetrap = {
  /** Shortcut match inspection hook */
  hook: ((matches: Array<MatchResult>) => void) | null;
  /** Resume listening for keyboard events */
  resume: () => void;
  /** Pause listening for keyboard events */
  pause: () => void;
  /** Set the target element to listen for keyboard events */
  setTarget: (target: Element | Document | null) => void;
  /** Manually handle a keyboard event */
  handleEvent: (e: KeyboardEvent, binds: Array<MicetrapBind>) => void;
  /** allow custom key mappings */
  addKeycodes: (keycodes: Record<number, string>) => void;
  /** Destroy the instance */
  destroy: () => void;
};

type MatchResult = { bind: MicetrapBind; complete: boolean; combo: string };

export type MicetrapOption = {
  /** Signal to abort the micetrap */
  signal?: AbortSignal;
  /** Timeout for sequence reset */
  sequenceTimeout?: number;
  /** Callback to determine if the event should be stopped */
  stopCallback?: ShouldStopCallback;
};

export function micetrap(
  binds: Array<MicetrapBind> = [],
  target: Element | Document | null = typeof document !== "undefined"
    ? document
    : null,
  {
    sequenceTimeout = 1000,
    stopCallback = defaultShouldStopCallback,
    signal: rootSignal,
  }: MicetrapOption = {}
): Micetrap {
  let abort: AbortController | undefined;
  let signal: AbortSignal | undefined;

  let paused = false;
  let sequenceState: string[] = [];
  let sequenceTimer: number | null = null;
  let overrideMap: StringMap = {};

  const handleEvent = (e: KeyboardEvent, _binds = binds) => {
    if (paused || stopCallback(e, e.target as Element, target!)) return;

    let matches: MatchResult[] = [];
    for (const bind of _binds) {
      const match = matchCombo(
        bind.keys,
        e,
        sequenceState.length,
        bind.phase,
        overrideMap
      );

      if (!match) continue;

      matches.push({ ...match, bind });

      if (match.complete) {
        bind.handler(e, match.combo);
        sequenceState = [];
      } else {
        sequenceState.push(match.combo);
      }

      if (sequenceTimer) clearTimeout(sequenceTimer);

      sequenceTimer = setTimeout(() => {
        sequenceState = [];
      }, sequenceTimeout) as unknown as number;
    }

    if (matches.length) ret.hook?.(matches);
  };

  const setTarget = (newTarget: Element | Document | null) => {
    abort?.abort();
    abort = new AbortController();
    signal = AbortSignal.any([abort.signal, rootSignal].filter((s) => !!s));

    target = newTarget;

    if (target) {
      addListener(target, "keydown", handleEvent, { signal });
      addListener(target, "keyup", handleEvent, { signal });
      addListener(target, "keypress", handleEvent, { signal });
    }
  };

  setTarget(target);

  const ret: Micetrap = {
    hook: null,
    resume: () => {
      paused = false;
    },
    pause: () => {
      paused = true;
    },
    handleEvent,
    setTarget,
    addKeycodes: (keycodes: Record<number, string>) => {
      for (const [k, v] of Object.entries(keycodes)) {
        overrideMap[k] = v;
      }
    },
    destroy() {
      abort?.abort();
    },
  };

  return ret;
}
