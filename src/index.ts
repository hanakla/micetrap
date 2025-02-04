import { defaultShouldStopCallback, matchCombo } from "./core";
import type {
  FlattenBind,
  MicetrapBind,
  MicetrapCallback,
  ShouldStopCallback,
  StringMap,
} from "./types";
import { addListener, reduceToMap, toArray } from "./utils";

export type { MicetrapCallback, MicetrapBind, ShouldStopCallback };

export type Micetrap = {
  binds: Array<MicetrapBind>;
  /** Shortcut match inspection hook */
  hook: ((matches: Array<MatchResult>) => void) | null;
  /** Resume listening for keyboard events */
  resume: () => Micetrap;
  /** Pause listening for keyboard events */
  pause: () => Micetrap;
  /** Bind a key combo */
  bind: (binds: Array<MicetrapBind>) => Micetrap;
  /** Unbind a key combo */
  unbind: (keys: string | string[], handler?: MicetrapCallback) => Micetrap;
  /** Set the target element to listen for keyboard events */
  setTarget: (target: Element | Document | null) => Micetrap;
  /** Manually handle a keyboard event */
  handleEvent: (e: KeyboardEvent, binds: Array<MicetrapBind>) => void;
  /** allow custom key mappings */
  addKeycodes: (keycodes: Record<number, string>) => Micetrap;
  /** Destroy the instance */
  destroy: () => void;
};

type MatchResult = { bind: MicetrapBind; complete: boolean; combo: string };

export type MicetrapOption = {
  /** Signal to abort the micetrap */
  signal?: AbortSignal;
  /**
   * Timeout for sequence reset
   * @default 1000
   */
  sequenceTimeout?: number;
  /**
   * Stop the event from propagating when a bind is matched
   * @default false
   */
  stopPropagation?: boolean;
  /** Callback to determine if the event should be stopped */
  stopCallback?: ShouldStopCallback;
};

export const micetrap = (
  target: Element | Document | null = typeof document !== "undefined"
    ? document
    : null,
  {
    sequenceTimeout = 1000,
    stopCallback = defaultShouldStopCallback,
    stopPropagation = false,
    signal: rootSignal,
  }: MicetrapOption = {}
): Micetrap => {
  let abort: AbortController | undefined;
  let signal: AbortSignal | undefined;

  let paused = false;
  let sequenceState: string[] = [];
  let sequenceTimer: number | null = null;
  const overrideMap: StringMap = {};

  let flatBinds = [] as FlattenBind[];

  const handleEvent = (
    e: KeyboardEvent,
    _binds: MicetrapBind[] = flatBinds
  ) => {
    if (paused || stopCallback(e, e.target as Element, target!)) return;

    let matches: MatchResult[] = [];
    for (const bind of _binds) {
      const match = matchCombo(
        bind.keys as string | string[],
        e,
        sequenceState.length,
        bind.phase,
        overrideMap
      );

      if (!match) continue;

      matches.push({ ...match, bind });

      if (match.complete) {
        if (bind.stopPropagation ?? stopPropagation) e.stopPropagation();
        if (bind.preventDefault) e.preventDefault();

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
    get binds() {
      return [...flatBinds];
    },
    resume: () => {
      paused = false;
      return ret;
    },
    pause: () => {
      paused = true;
      return ret;
    },
    bind: (binds) => {
      binds.forEach((b) =>
        toArray(b.keys).forEach((k) => {
          flatBinds.push({ ...b, keys: k });
          addListener(b.signal, "abort", () => ret.unbind(k, b.handler));
        })
      );

      return ret;
    },
    unbind: (keys, handler?) => {
      const keyIndexMap = reduceToMap(flatBinds, (acc, { keys: k }, index) => {
        acc[k] ? acc[k].push(index) : (acc[k] = [index]);
      });

      toArray(keys).map((k) => {
        keyIndexMap[k]?.forEach((i) => {
          if (!handler || flatBinds[i].handler === handler) {
            flatBinds.splice(i, 1);
          }
        });
      });

      return ret;
    },
    handleEvent,
    setTarget: (newTarget) => (setTarget(newTarget), ret),
    addKeycodes: (keycodes: Record<number, string>) => {
      for (const [k, v] of Object.entries(keycodes)) {
        overrideMap[k] = v;
      }
      return ret;
    },
    destroy() {
      flatBinds = [];
      abort?.abort();
    },
  };

  return ret;
};
