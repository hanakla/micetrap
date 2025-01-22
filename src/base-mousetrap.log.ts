import { MicetrapCallback } from "./core";

type NumberMap = {
  [key: string]: number;
  [key: number]: number;
};

type SimpleEvent = {
  type: string;
  metaKey?: any;
  ctrlKey?: any;
};

type Callback = {
  seq: string | undefined;
  level: number | undefined;
  combo: string;
  callback: MicetrapCallback;
  modifiers: Modifiers;
  action: string;
};

type Callbacks = {
  [key: string]: Callback[];
};

type DirectMap = {
  [key: string]: MicetrapCallback;
};

export class Micetrap {
  /**
   * variable to store the flipped version of _MAP from above
   * needed to check if we should use keypress or not when no action
   * is specified
   */
  private static _REVERSE_MAP: StringMap | null;

  private static _instance: Micetrap;

  private static get instance() {
    return (Micetrap._instance ??= new Micetrap(window.document));
  }

  public static bind(
    keys: KeyBindings | string | string[],
    callback: MicetrapCallback,
    option?: BindOption
  ): void {
    Micetrap.instance.bind(keys, callback, option);
  }

  public static bindMap(
    map: { [key: string]: MicetrapCallback },
    option?: BindOption
  ): void {
    Micetrap.instance.bindMap(map, option);
  }

  public static unbind(
    keys: KeyBindings | string | string[],
    action?: ActionPhase
  ): void {
    Micetrap.instance.unbind(keys, action);
  }

  public static trigger(keys: string, action?: ActionPhase): void {
    Micetrap.instance.trigger(keys, action);
  }

  /* ------------------------- NON STATIC ---------------------------- */

  /**
   * element to attach key events to
   */
  public target: HTMLElement | HTMLDocument;
  /**
   * a list of all the callbacks setup via Mousetrap.bind()
   */
  private _callbacks: Callbacks = {};
  /**
   * direct map of string combinations to callbacks used for trigger()
   */
  private _directMap: DirectMap = {};
  /**
   * keeps track of what level each sequence is at since multiple
   * sequences can start out with the same sequence
   */
  private _sequenceLevels: NumberMap = {};
  /**
   * variable to store the setTimeout call
   */
  private _resetTimer: number | null;
  /**
   * temporary state where we will ignore the next keyup
   */
  private _ignoreNextKeyup: boolean | string = false;
  /**
   * temporary state where we will ignore the next keypress
   */
  private _ignoreNextKeypress: boolean = false;
  /**
   * are we currently inside of a sequence?
   * type of action ("keyup" or "keydown" or "keypress") or false
   */
  private _nextExpectedAction: boolean | ActionPhase = false;

  private abortController: AbortController = new AbortController();

  constructor(
    target: HTMLElement | Document,
    options: AddEventListenerOptions = {}
  ) {
    this.target = target || (window.document as HTMLDocument);

    const signal = AbortSignal.any(
      [this.abortController.signal].concat(
        options.signal ? [options.signal] : []
      )
    );

    const option: AddEventListenerOptions = {
      capture: options.capture,
      signal,
    };

    // Bind events
    target.addEventListener("keypress", this._handleKeyEvent, option);
    target.addEventListener("keydown", this._handleKeyEvent, option);
    target.addEventListener("keyup", this._handleKeyEvent, option);
  }

  /**
   * resets all sequence counters except for the ones passed in
   *
   * @param {Object} doNotReset
   * @returns void
   */
  private _resetSequences(doNotReset: NumberMap = {}): void {
    let activeSequences: boolean = false;

    for (const key in this._sequenceLevels) {
      if (doNotReset[key]) {
        activeSequences = true;
        continue;
      }
      this._sequenceLevels[key] = 0;
    }

    if (!activeSequences) {
      this._nextExpectedAction = false;
    }
  }

  /**
   * finds all callbacks that match based on the keycode, modifiers,
   */
  private _getMatches(
    character: string,
    modifiers: Modifiers,
    e: KeyboardEvent | SimpleEvent,
    sequenceName?: string,
    combination?: string,
    level?: number
  ): Callback[] {
    let callback: Callback;
    const matches: Callback[] = [];
    const action = e.type;

    // if there are no events related to this keycode
    if (!this._callbacks[character]) {
      return [];
    }

    // if a modifier key is coming up on its own we should allow it
    if (action === "keyup" && Micetrap._isModifier(character)) {
      modifiers = [character];
    }

    // loop through all callbacks for the key that was pressed
    // and see if any of them match
    for (let i = 0; i < this._callbacks[character].length; ++i) {
      callback = this._callbacks[character][i];

      // if a sequence name is not specified, but this is a sequence at
      // the wrong level then move onto the next match
      if (
        !sequenceName &&
        callback.seq &&
        this._sequenceLevels[callback.seq] !== callback.level
      ) {
        continue;
      }

      // if the action we are looking for doesn't match the action we got
      // then we should keep going
      if (action !== callback.action) {
        continue;
      }

      // if this is a keypress event and the meta key and control key
      // are not pressed that means that we need to only look at the
      // character, otherwise check the modifiers as well
      //
      // chrome will not fire a keypress if meta or control is down
      // safari will fire a keypress if meta or meta+shift is down
      // firefox will fire a keypress if meta or control is down
      if (
        (action === "keypress" && !e.metaKey && !e.ctrlKey) ||
        Micetrap._modifiersMatch(modifiers, callback.modifiers)
      ) {
        // when you bind a combination or sequence a second time it
        // should overwrite the first one.  if a sequenceName or
        // combination is specified in this call it does just that
        //
        // @todo make deleting its own method?
        const deleteCombo = !sequenceName && callback.combo === combination;
        const deleteSequence =
          sequenceName &&
          callback.seq === sequenceName &&
          callback.level === level;
        if (deleteCombo || deleteSequence) {
          this._callbacks[character].splice(i, 1);
        }

        matches.push(callback);
      }
    }

    return matches;
  }

  /**
   * actually calls the callback function
   *
   * if your callback function returns false this will use the jquery
   * convention - prevent default and stop propogation on the event
   */
  private _fireCallback(
    callback: MicetrapCallback,
    e: KeyboardEvent,
    combo: string
  ): void {
    // if this event should not happen stop here
    if (this.stopCallback(e, e.target as HTMLElement)) {
      return;
    }

    // Why assume callback return something?
    if (callback(e, combo) === false) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  /**
   * handles a character key event
   *
   * @param {string} character
   * @param {Array} modifiers
   * @param {Event} e
   * @returns void
   */
  private _handleKey(
    character: string,
    modifiers: Modifiers,
    e: KeyboardEvent
  ): void {
    const callbacks = this._getMatches(character, modifiers, e);

    let i: number;
    const doNotReset: NumberMap = {};
    let maxLevel: number = 0;
    let processedSequenceCallback = false;

    // Calculate the maxLevel for sequences so we can only execute the longest callback sequence
    for (i = 0; i < callbacks.length; ++i) {
      if (callbacks[i].seq) {
        maxLevel = Math.max(maxLevel, callbacks[i].level ?? maxLevel);
      }
    }

    // loop through matching callbacks for this key event
    for (i = 0; i < callbacks.length; ++i) {
      // fire for all sequence callbacks
      // this is because if for example you have multiple sequences
      // bound such as "g i" and "g t" they both need to fire the
      // callback for matching g cause otherwise you can only ever
      // match the first one
      const seq = callbacks[i].seq;
      if (seq) {
        // only fire callbacks for the maxLevel to prevent
        // subsequences from also firing
        //
        // for example 'a option b' should not cause 'option b' to fire
        // even though 'option b' is part of the other sequence
        //
        // any sequences that do not match here will be discarded
        // below by the _resetSequences call
        if (callbacks[i].level !== maxLevel) {
          continue;
        }

        processedSequenceCallback = true;

        // keep a list of which sequences were matches for later
        doNotReset[seq] = 1;
        this._fireCallback(callbacks[i].callback, e, callbacks[i].combo);
        continue;
      }

      // if there were no sequence matches but we are still here
      // that means this is a regular match so we should fire that
      if (!processedSequenceCallback) {
        this._fireCallback(callbacks[i].callback, e, callbacks[i].combo);
      }
    }

    // if the key you pressed matches the type of sequence without
    // being a modifier (ie "keyup" or "keypress") then we should
    // reset all sequences that were not matched by this event
    //
    // this is so, for example, if you have the sequence "h a t" and you
    // type "h e a r t" it does not match.  in this case the "e" will
    // cause the sequence to reset
    //
    // modifier keys are ignored because you can have a sequence
    // that contains modifiers such as "enter ctrl+space" and in most
    // cases the modifier key will be pressed before the next key
    //
    // also if you have a sequence such as "ctrl+b a" then pressing the
    // "b" key will trigger a "keypress" and a "keydown"
    //
    // the "keydown" is expected when there is a modifier, but the
    // "keypress" ends up matching the this._nextExpectedAction since it occurs
    // after and that causes the sequence to reset
    //
    // we ignore keypresses in a sequence that directly follow a keydown
    // for the same character
    const ignoreThisKeypress =
      e.type === "keypress" && this._ignoreNextKeypress;
    if (
      e.type === this._nextExpectedAction &&
      !Micetrap._isModifier(character) &&
      !ignoreThisKeypress
    ) {
      this._resetSequences(doNotReset);
    }

    this._ignoreNextKeypress =
      processedSequenceCallback && e.type === "keydown";
  }

  /**
   * handles a keydown event
   */
  private _handleKeyEvent = (e: KeyboardEvent): void => {
    // normalize e.which for key events
    // @see http://stackoverflow.com/questions/4285627/javascript-keycode-vs-charcode-utter-confusion
    if (typeof e.which !== "number") {
      //e.which is read-only. Cast as any to ignore.
      (e.which as any) = e.keyCode;
    }

    const character = characterFromEvent(e);

    // no character found then stop
    if (!character) {
      return;
    }

    // need to use === for the character check because the character can be 0
    if (e.type === "keyup" && this._ignoreNextKeyup === character) {
      this._ignoreNextKeyup = false;
      return;
    }

    this._handleKey(character, Micetrap._eventModifiers(e), e);
  };

  /**
   * called to set a 1 second timeout on the specified sequence
   *
   * this is so after each key press in the sequence you have 1 second
   * to press the next key before you have to start over
   */
  private _resetSequenceTimer(): void {
    if (this._resetTimer != null) clearTimeout(this._resetTimer);
    this._resetTimer = window.setTimeout(this._resetSequences, 1000);
  }

  /**
   * binds a key sequence to an event
   */
  private _bindSequence(
    combo: string,
    keys: string[],
    callback: MicetrapCallback,
    { action, signal }: BindOption = {}
  ): void {
    // start off by adding a sequence level record for this combination
    // and setting the level to 0
    this._sequenceLevels[combo] = 0;

    /**
     * callback to increase the sequence level for this sequence and reset
     * all other sequences that were active
     */
    const _increaseSequence = (nextAction: ActionPhase): MicetrapCallback => {
      return () => {
        this._nextExpectedAction = nextAction;
        ++this._sequenceLevels[combo];
        this._resetSequenceTimer();
        return;
      };
    };

    /**
     * wraps the specified callback inside of another function in order
     * to reset all sequence counters as soon as this sequence is done
     */
    const _callbackAndReset = (e: KeyboardEvent) => {
      this._fireCallback(callback, e, combo);

      // we should ignore the next key up if the action is key down
      // or keypress.  this is so if you finish a sequence and
      // release the key the final key will not trigger a keyup
      if (action !== "keyup") {
        this._ignoreNextKeyup = characterFromEvent(e);
      }

      // weird race condition if a sequence ends with the key
      // another sequence begins with
      window.setTimeout(this._resetSequences, 10);

      return;
    };

    // loop through keys one at a time and bind the appropriate callback
    // function.  for any key leading up to the final one it should
    // increase the sequence. after the final, it should reset all sequences
    //
    // if an action is specified in the original bind call then that will
    // be used throughout.  otherwise we will pass the action that the
    // next key in the sequence should match.  this allows a sequence
    // to mix and match keypress and keydown events depending on which
    // ones are better suited to the key provided
    for (let i = 0; i < keys.length; ++i) {
      const isFinal = i + 1 === keys.length;
      const wrappedCallback: MicetrapCallback = isFinal
        ? _callbackAndReset
        : _increaseSequence(action || Micetrap._getKeyInfo(keys[i + 1]).action);
      this._bindSingle(keys[i], wrappedCallback, { action, signal }, combo, i);
    }
  }

  /**
   * binds a single keyboard combination
   */
  private _bindSingle(
    combination: string,
    callback: MicetrapCallback,
    option: BindOption = {},
    sequenceName?: string,
    level?: number
  ): void {
    // store a direct mapped reference for use with Mousetrap.trigger
    this._directMap[combination + ":" + option.action] = callback;

    // make sure multiple spaces in a row become a single space
    combination = combination.replace(/\s+/g, " ");

    const sequence = combination.split(" ");
    let info: KeyInfo;

    // if this pattern is a sequence of keys then run through this method
    // to reprocess each pattern one key at a time
    if (sequence.length > 1) {
      this._bindSequence(combination, sequence, callback, option);
      return;
    }

    info = Micetrap._getKeyInfo(combination, option.action);

    // make sure to initialize array if this is the first time
    // a callback is added for this key
    this._callbacks[info.key] ??= [];

    // remove an existing match if there is one
    this._getMatches(
      info.key,
      info.modifiers,
      { type: info.action },
      sequenceName,
      combination,
      level
    );

    // add this call back to the array
    // if it is a sequence put it at the beginning
    // if not put it at the end
    //
    // this is important because the way these are processed expects
    // the sequence ones to come first
    this._callbacks[info.key][sequenceName ? "unshift" : "push"]({
      callback,
      modifiers: info.modifiers,
      action: info.action,
      seq: sequenceName,
      level,
      combo: combination,
    });
  }

  /**
   * binds an event to mousetrap
   *
   * can be a single key, a combination of keys separated with +,
   * an array of keys, or a sequence of keys separated by spaces
   *
   * be sure to list the modifier keys first to make sure that the
   * correct key ends up getting bound (the last key in the pattern)
   */
  public bind(
    keys: KeyBindings | string | string[],
    callback: MicetrapCallback,
    option?: BindOption
  ): Micetrap {
    keys = Array.isArray(keys) ? keys : [keys];

    option?.signal?.addEventListener("abort", () => {
      this.unbind(keys, option?.action);
    });

    for (const key of keys) {
      this._bindSingle(key, callback, option);
    }

    return this;
  }

  /**
   * object to bind multiple key events in a single call
   *
   * You can pass it in like:
   *
   * Mousetrap.bind({
   *     'a': () => { console.log('a'); },
   *     'b': () => { console.log('b'); }
   * });
   *
   * And can optionally pass options as a second argument
   */
  public bindMap(
    map: { [key: string]: MicetrapCallback },
    option?: BindOption
  ): Micetrap {
    for (const key in map) {
      this.bind(key, map[key], option);
    }
    return this;
  }

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
  public unbind(
    keys: KeyBindings | string | string[],
    action?: ActionPhase
  ): Micetrap {
    const emptyFunc = () => {};
    this.bind(keys, emptyFunc, { action });
    return this;
  }

  /**
   * triggers an event that has already been bound
   */
  public trigger(keys: string, action?: ActionPhase): Micetrap {
    if (this._directMap[keys + ":" + action]) {
      (this._directMap[keys + ":" + action] as MicetrapCallback)(
        new KeyboardEvent("keydown"),
        keys
      );
    }
    return this;
  }

  /**
   * resets the library back to its initial state.  this is useful
   * if you want to clear out the current keyboard shortcuts and bind
   * new ones - for example if you switch to another page
   */
  public reset(): Micetrap {
    this._callbacks = {};
    this._directMap = {};
    return this;
  }

  public stopCallback(e: KeyboardEvent, element: HTMLElement): boolean {}

  /**
   * allow custom key mappings
   */
  public addKeycodes = (object) => {
    for (const key in object) {
      if (object.hasOwnProperty(key)) {
        Micetrap._MAP[key] = object[key];
      }
    }
    Micetrap._REVERSE_MAP = null;
  };

  /**
   * Method to remove all listerners for a target element
   */
  public destroy() {
    this.abortController.abort();
    this.reset();
  }
}
