/**
 * Copyright 2012-2017 Craig Campbell
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Mousetrap is a simple keyboard shortcut library for Javascript with
 * no external dependencies
 *
 * @version 1.6.1
 * @url craig.is/killing/mice
 *
 * Changed by: JonWallsten - Converted to ES2015 and TypeScript.
 * @version 1.0.0
 *
 * Changed by: Hanakla - Refine APIs for modern usage.
 * @version 1.0.0
 */

import type {
  ActionPhase,
  KeyInfo,
  ModifierKey,
  Modifiers,
  ShouldStopCallback,
  StringMap,
} from "./types";
import { fromCharCode, reduceToMap, toArray } from "./utils";

/**
 * should we stop this event before firing off callbacks
 */
export const defaultShouldStopCallback: ShouldStopCallback = (
  e,
  element,
  rootElement
): boolean => {
  if (element.classList.contains("mousetrap")) {
    return false;
  }

  if (rootElement?.contains(element)) {
    return false;
  }

  // stop for input, select, and textarea
  return (
    ["INPUT", "SELECT", "TEXTAREA"].includes(element.tagName) ||
    (element as HTMLElement).isContentEditable
  );
};

/**
 * Checks if the given combo matches the event
 */
export const matchCombo = (
  combos: string | readonly string[],
  event: KeyboardEvent,
  seqLevel: number = 0,
  phase?: ActionPhase,
  mapOverrides?: StringMap
): { complete: boolean; combo: string } | null => {
  const action = event.type;
  combos = toArray(combos);

  for (let combo of combos) {
    const seq = combo.split(" ");
    combo = seq[seqLevel];
    if (!combo) continue;

    const keyInfo = getKeyInfo(combo, phase, mapOverrides);
    const character = characterFromEvent(event, mapOverrides);
    const modifiers = eventModifiers(event);

    if (
      keyInfo.key === character &&
      modifiersMatch(keyInfo.modifiers, modifiers) &&
      action === keyInfo.action
    ) {
      return {
        complete: seq.length === seqLevel + 1,
        combo,
      };
    }
  }

  return null;
};

/**
 * mapping of special keycodes to their corresponding keys
 *
 * everything in this dictionary cannot use keypress events
 * so it has to be here to map to the correct keycodes for
 * keyup/keydown events
 */
const _MAP: StringMap = {
  8: "backspace",
  9: "tab",
  13: "enter",
  16: "shift",
  17: "ctrl",
  18: "alt",
  20: "capslock",
  27: "esc",
  32: "space",
  33: "pageup",
  34: "pagedown",
  35: "end",
  36: "home",
  37: "left",
  38: "up",
  39: "right",
  40: "down",
  45: "ins",
  46: "del",
  91: "meta",
  93: "meta",
  224: "meta",

  // loop through the f keys, f1 to f19 and add them to the map
  // programatically
  ...reduceToMap(
    [...Array(19)],
    (acc, _, index) => (acc[112 + index] = `f${index + 1}`)
  ),
  // loop through to map numbers on the numeric keypad
  ...reduceToMap(
    [...Array(10)],
    (acc, _, index) =>
      // This needs to use a string cause otherwise since 0 is falsey
      // mousetrap will never fire for numpad 0 pressed as part of a keydown
      // event.
      //
      // @see https://github.com/ccampbell/mousetrap/pull/258
      (acc[96 + index] = index.toString())
  ),
};

const KEYCODE_MAP: StringMap = {
  106: "*",
  107: "+",
  109: "-",
  110: ".",
  111: "/",
  186: ";",
  187: "=",
  188: ",",
  189: "-",
  190: ".",
  191: "/",
  192: "`",
  219: "[",
  220: "\\",
  221: "]",
  222: "'",
};

/**
 * this is a mapping of keys that require shift on a US keypad
 * back to the non shift equivelents
 *
 * this is so you can use keyup events with these keys
 *
 * note that this will only work reliably on US keyboards
 */
const SHIFT_MAP: StringMap = {
  "~": "`",
  "!": "1",
  "@": "2",
  "#": "3",
  $: "4",
  "%": "5",
  "^": "6",
  "&": "7",
  "*": "8",
  "(": "9",
  ")": "0",
  _: "-",
  "+": "=",
  ":": ";",
  '"': "'",
  "<": ",",
  ">": ".",
  "?": "/",
  "|": "\\",
};

/**
 * this is a list of special strings you can use to map
 * to modifier keys when you specify your keyboard shortcuts
 */
const _SPECIAL_ALIASES: { [key: string]: string } = {
  option: "alt",
  command: "meta",
  return: "enter",
  escape: "esc",
  plus: "+",
  mod:
    typeof navigator === "object"
      ? /Mac|iPod|iPhone|iPad/.test(navigator.platform)
        ? "meta"
        : "ctrl"
      : "ctrl",
};

/**
 * takes the event and returns the key character
 */
const characterFromEvent = (
  e: KeyboardEvent,
  mapOverrides?: StringMap
): string => {
  const _map = mapOverrides ? Object.assign({}, _MAP, mapOverrides) : _MAP;

  // for keypress events we should return the character as is
  if (e.type === "keypress") {
    let character = fromCharCode(e.which);

    // if the shift key is not pressed then it is safe to assume
    // that we want the character to be lowercase.  this means if
    // you accidentally have caps lock on then your key bindings
    // will continue to work
    //
    // the only side effect that might not be desired is if you
    // bind something like 'A' cause you want to trigger an
    // event when capital A is pressed caps lock will no longer
    // trigger the event.  shift+a will though.
    if (!e.shiftKey) {
      character = character.toLowerCase();
    }

    return character;
  }

  // for non keypress events the special maps are needed
  if (_map[e.which]) return _map[e.which];
  if (KEYCODE_MAP[e.which]) KEYCODE_MAP[e.which];

  // if it is not in the special map

  // with keydown and keyup events the character seems to always
  // come in as an uppercase character whether you are pressing shift
  // or not.  we should make sure it is always lowercase for comparisons
  return fromCharCode(e.which).toLowerCase();
};

/**
 * takes a key event and figures out what the modifiers are
 */
const eventModifiers = (e: KeyboardEvent): Modifiers => {
  return (["shift", "alt", "ctrl", "meta"] as const).filter(
    (k) => e[`${k}Key`]
  );
};

/**
 * Gets info for a specific key combination
 * @returns {Object}
 */
const getKeyInfo = (
  combination: string,
  action?: ActionPhase,
  mapOverrides?: StringMap
): KeyInfo => {
  let keys: string[];
  const modifiers: Modifiers = [];

  // take the keys from this pattern and figure out what the actual
  // pattern is all about
  keys = keysFromString(combination);

  let key: string;
  for (key of keys) {
    // normalize key names
    if (_SPECIAL_ALIASES[key]) {
      key = _SPECIAL_ALIASES[key];
    }

    // if this is not a keypress event then we should
    // be smart about using shift keys
    // this will only work for US keyboards however
    if (action !== "keypress" && SHIFT_MAP[key]) {
      key = SHIFT_MAP[key];
      modifiers.push("shift");
    }

    // if this key is a modifier then add it to the list of modifiers
    if (isModifier(key)) modifiers.push(key);
  }

  // depending on what the key combination is
  // we will try to pick the best event for it
  action = pickBestAction(key!, modifiers, action, mapOverrides);

  return {
    key: key!,
    modifiers,
    action,
  };
};

/**
 * picks the best action based on the key combination
 */
const pickBestAction = (
  key: string,
  modifiers: Modifiers,
  action?: ActionPhase,
  mapOverrides?: StringMap
) => {
  const _map = mapOverrides ? Object.assign({}, _MAP, mapOverrides) : _MAP;

  // if no action was picked in we should try to pick the one
  // that we think would work best for this key
  if (!action) {
    action = getReverseMap(_map)[key] ? "keydown" : "keypress";
  }

  // modifier keys don't work as expected with keypress,
  // switch to keydown
  if (action === "keypress" && modifiers.length) {
    action = "keydown";
  }

  return action;
};

/**
 * reverses the map lookup so that we can look for specific keys
 * to see what can and can't use keypress
 */
const getReverseMap = (map: StringMap): StringMap => {
  const reverseMap = { ...map };

  for (const key in Object.keys(_MAP)) {
    // pull out the numeric keypad from here cause keypress should
    // be able to detect the keys from the character
    if ((key as any) > 95 && (key as any) < 112) {
      continue;
    }

    reverseMap[_MAP[key]] = key;
  }

  return reverseMap;
};

/**
 * checks if two arrays are equal
 */
const modifiersMatch = (
  modifiers1: Modifiers,
  modifiers2: Modifiers
): boolean => {
  return modifiers1.sort().join(",") === modifiers2.sort().join(",");
};

/**
 * determines if the keycode specified is a modifier key or not
 */
const isModifier = (key: string): key is ModifierKey => {
  return key === "shift" || key === "ctrl" || key === "alt" || key === "meta";
};

/**
 * Converts from a string key combination to an array
 */
const keysFromString = (combination: string): string[] => {
  if (combination === "+") return ["+"];
  return combination.replace(/\+{2}/g, "+plus").split("+");
};
