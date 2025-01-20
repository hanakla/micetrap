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
type BindOption = {
    action?: ActionPhase;
    signal?: AbortSignal;
};
type ActionPhase = "keyup" | "keydown" | "keypress";
type CallbackFunction = (e: KeyboardEvent, combo: string) => boolean | void;
/**
 * This is useful if you want to have a single entry to combos instead of letting devs create their own combos.
 */
declare enum KeyBindings {
    moveUp = "up",
    moveDown = "down",
    moveRight = "right",
    moveLeft = "left",
    pageUp = "pageup",
    pageDown = "pagedown",
    home = "home",
    end = "end",
    ctrlHome = "ctrl+home",
    ctrlEnd = "ctrl+end"
}
declare class Mousetrap {
    /**
     * mapping of special keycodes to their corresponding keys
     *
     * everything in this dictionary cannot use keypress events
     * so it has to be here to map to the correct keycodes for
     * keyup/keydown events
     */
    private static _MAP;
    /**
     * mapping for special characters so they can support
     *
     * this dictionary is only used incase you want to bind a
     * keyup or keydown event to one of these keys
     */
    private static _KEYCODE_MAP;
    /**
     * this is a mapping of keys that require shift on a US keypad
     * back to the non shift equivelents
     *
     * this is so you can use keyup events with these keys
     *
     * note that this will only work reliably on US keyboards
     */
    private static _SHIFT_MAP;
    /**
     * this is a list of special strings you can use to map
     * to modifier keys when you specify your keyboard shortcuts
     *
     * @type {Object}
     */
    private static _SPECIAL_ALIASES;
    /**
     * variable to store the flipped version of _MAP from above
     * needed to check if we should use keypress or not when no action
     * is specified
     */
    private static _REVERSE_MAP;
    private static _mapSpecialKeys;
    /**
     * takes the event and returns the key character
     */
    private static _characterFromEvent;
    /**
     * checks if two arrays are equal
     */
    private static _modifiersMatch;
    /**
     * takes a key event and figures out what the modifiers are
     */
    private static _eventModifiers;
    /**
     * determines if the keycode specified is a modifier key or not
     */
    private static _isModifier;
    /**
     * reverses the map lookup so that we can look for specific keys
     * to see what can and can't use keypress
     */
    private static _getReverseMap;
    /**
     * picks the best action based on the key combination
     */
    private static _pickBestAction;
    /**
     * Converts from a string key combination to an array
     */
    private static _keysFromString;
    /**
     * Gets info for a specific key combination
     * @returns {Object}
     */
    private static _getKeyInfo;
    private static _belongsTo;
    private static _instance;
    private static get instance();
    static bind(keys: KeyBindings | string | string[], callback: CallbackFunction, option?: BindOption): void;
    static unbind(keys: KeyBindings | string | string[], action?: ActionPhase): void;
    static trigger(keys: string, action?: ActionPhase): void;
    /**
     * element to attach key events to
     */
    target: HTMLElement | HTMLDocument;
    /**
     * a list of all the callbacks setup via Mousetrap.bind()
     */
    private _callbacks;
    /**
     * direct map of string combinations to callbacks used for trigger()
     */
    private _directMap;
    /**
     * keeps track of what level each sequence is at since multiple
     * sequences can start out with the same sequence
     */
    private _sequenceLevels;
    /**
     * variable to store the setTimeout call
     */
    private _resetTimer;
    /**
     * temporary state where we will ignore the next keyup
     */
    private _ignoreNextKeyup;
    /**
     * temporary state where we will ignore the next keypress
     */
    private _ignoreNextKeypress;
    /**
     * are we currently inside of a sequence?
     * type of action ("keyup" or "keydown" or "keypress") or false
     */
    private _nextExpectedAction;
    private abortController;
    constructor(target: HTMLElement | Document, options?: AddEventListenerOptions);
    /**
     * resets all sequence counters except for the ones passed in
     *
     * @param {Object} doNotReset
     * @returns void
     */
    private _resetSequences;
    /**
     * finds all callbacks that match based on the keycode, modifiers,
     */
    private _getMatches;
    /**
     * actually calls the callback function
     *
     * if your callback function returns false this will use the jquery
     * convention - prevent default and stop propogation on the event
     */
    private _fireCallback;
    /**
     * handles a character key event
     *
     * @param {string} character
     * @param {Array} modifiers
     * @param {Event} e
     * @returns void
     */
    private _handleKey;
    /**
     * handles a keydown event
     */
    private _handleKeyEvent;
    /**
     * called to set a 1 second timeout on the specified sequence
     *
     * this is so after each key press in the sequence you have 1 second
     * to press the next key before you have to start over
     */
    private _resetSequenceTimer;
    /**
     * binds a key sequence to an event
     */
    private _bindSequence;
    /**
     * binds a single keyboard combination
     */
    private _bindSingle;
    /**
     * binds an event to mousetrap
     *
     * can be a single key, a combination of keys separated with +,
     * an array of keys, or a sequence of keys separated by spaces
     *
     * be sure to list the modifier keys first to make sure that the
     * correct key ends up getting bound (the last key in the pattern)
     */
    bind(keys: KeyBindings | string | string[], callback: CallbackFunction, option?: BindOption): Mousetrap;
    /**
     * unbinds an event to mousetrap
     *
     * the unbinding sets the callback function of the specified key combo
     * to an empty function and deletes the corresponding key in the
     * _directMap dict.
     *
     * TODO: actually remove this from the _callbacks dictionary instead
     * of binding an empty function
     *
     * the keycombo+action has to be exactly the same as
     * it was defined in the bind method
     */
    unbind(keys: KeyBindings | string | string[], action?: ActionPhase): Mousetrap;
    /**
     * triggers an event that has already been bound
     */
    trigger(keys: string, action?: ActionPhase): Mousetrap;
    /**
     * resets the library back to its initial state.  this is useful
     * if you want to clear out the current keyboard shortcuts and bind
     * new ones - for example if you switch to another page
     */
    reset(): Mousetrap;
    /**
     * should we stop this event before firing off callbacks
     */
    stopCallback(e: KeyboardEvent, element: HTMLElement): boolean;
    /**
     * allow custom key mappings
     */
    addKeycodes: (object: any) => void;
    /**
     * Method to remove all listerners for a target element
     */
    destroy(): void;
}

export { type CallbackFunction, KeyBindings, Mousetrap };
