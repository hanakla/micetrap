# Micetrap

`@hanakla/micetrap` is a simple library for handling keyboard shortcuts in TypeScript.  
Based on [Mousetrap](https://github.com/ccampbell/mousetrap) and [mousetrap-ts](https://github.com/JonWallsten/mousetrap-ts)

It is licensed under the Apache 2.0 license.

It is around
![minified gzipped size](https://img.shields.io/bundlephobia/minzip/@hanakla/micetrap?style=flat-square) and ![minified size](https://img.shields.io/bundlephobia/min/@hanakla/micetrap?style=flat-square), has no external dependencies.

It has support for `keypress`, `keydown`, and `keyup` events on specific keys, keyboard combinations, or key sequences.

## Getting started

1.  Install micetrap

    install `micetrap` from `npm` and import it

    ```ts
    import { micetrap } from "@hanakla/micetrap";
    ```

2.  Add some keyboard events to listen for

    ```typescript
    // single keys
    micetrap([
      { keys: "4", handler: () => console.log("4") },
      { keys: "?", handler: () => console.log("show shortcuts!") },
    ]);

    micetrap([{ keys: "esc", handler: () => console.log("escape") }], {
      action: "keyup",
    });

    // combinations (ctrl+shift+k or command+shift+k by platform)
    micetrap([
      { keys: ["meta+shift+k"], handler: () => console.log("meta shift k") },

      // map multiple combinations to the same callback
      {
        keys: ["command+k", "ctrl+k"],
        handler: () => {
          console.log("command k or control k");

          // return false to prevent default browser behavior and stop event from bubbling
          return false;
        },
      },
    ]);

    // gmail style sequences
    micetrap([
      { keys: "g i", handler: () => console.log("go to inbox") },
      { keys: "* a", handler: () => console.log("select all") },
    ]);

    // konami code!
    micetrap([
      {
        keys: "up up down down left right left right b a enter",
        handler: () => console.log("konami code!"),
      },
    ]);
    ```

### React hooks

Micetrap provides React hooks that can be imported from a separate bundle, `@hanakla/micetrap/react`. This allows you to easily set up key event handlers at both the element and document levels. The modular approach ensures that you only load the necessary features, keeping your application lightweight and efficient.

```tsx
import { useDocumentMicetrap, useMicetrap } from "@hanakla/micetrap/react";

function App() {
  // Element-level Micetrap: Attach key handlers to a specific element.
  // Handlers are automatically wrapped with `useEffectCallback`,
  // so you don't need to manually use `useCallback`.
  const ref = useMiceTrap([
    { keys: "4", handler: () => console.log("Key '4' pressed") },
    { keys: "?", handler: () => console.log("Show shortcuts!") },
  ]);

  // Document-level Micetrap: Attach key handlers globally to the document.
  useDocumentMicetrap([
    { keys: "esc", handler: () => console.log("Escape key pressed") },
  ]);

  return <div ref={ref}>Your App</div>;
}
```

## Why Mousetrap?

There are a number of other similar libraries out there so what makes this one different?

- There are no external dependencies, no framework is required
- You are not limited to `keydown` events (You can specify `keypress`, `keydown`, or `keyup` or let Mousetrap choose for you).
- You can bind key events directly to special keys such as `?` or `*` without having to specify `shift+/` or `shift+8` which are not consistent across all keyboards
- It works with international keyboard layouts
- You can bind Gmail like key sequences in addition to regular keys and key combinations
- You can programatically trigger key events with the `trigger()` method
- It works with the numeric keypad on your keyboard
- The code is well documented/commented
