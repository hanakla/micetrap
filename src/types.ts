export type StringMap = {
  [key: string]: string;
  [key: number]: string;
};

export type KeyInfo = {
  key: string;
  modifiers: Modifiers;
  action: ActionPhase;
};

export type ActionPhase = "keyup" | "keydown" | "keypress";
export type ModifierKey = "shift" | "ctrl" | "alt" | "meta";
export type Modifiers = Array<ModifierKey>;

export type MicetrapBind = {
  keys: string | string[];
  handler: MicetrapCallback;
  phase?: ActionPhase;
  signal?: AbortSignal;
  preventDefault?: boolean;
  stopPropagation?: boolean;
};

export type FlattenBind = {
  keys: string;
  handler: MicetrapCallback;
  phase?: ActionPhase;
  preventDefault?: boolean;
  stopPropagation?: boolean;
};

export type MicetrapCallback = (
  e: KeyboardEvent,
  combo: string
) => boolean | void;

export type ShouldStopCallback = (
  e: KeyboardEvent,
  element: Element,
  rootElement: Element | Document | null
) => boolean;
