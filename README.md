# Micetrap

`@hanakla/micetrap` is a simple library for handling keyboard shortcuts in TypeScript.  
Based on [Mousetrap](https://github.com/ccampbell/mousetrap) and [mousetrap-ts](https://github.com/JonWallsten/mousetrap-ts).

**Show example in [StackBlits](https://stackblitz.com/edit/vitejs-vite-muqvhqwc)!**

It is licensed under the Apache 2.0 license.

It is around
![minified gzipped size](https://img.shields.io/bundlephobia/minzip/@hanakla/micetrap?style=flat-square) and ![minified size](https://img.shields.io/bundlephobia/min/@hanakla/micetrap?style=flat-square), has no external dependencies.

It has support for `keypress`, `keydown`, and `keyup` events on specific keys, keyboard combinations, or key sequences.

## Features

- **Lightweight**: No external dependencies.
- **Flexible Events**: Supports `keypress`, `keydown`, and `keyup` events.
- **Key Sequences**: Bind sequences like Gmail-style shortcuts or the Konami Code.
- **Special Keys**: Handle keys like `?`, `*`, and others directly.
- **Cross-Platform**: Works with international keyboard layouts.
- **Numeric Keypad Support**: Compatible with numpad keys.
- **Customizable**: Add custom key mappings.
- **React Integration**: Provides React hooks for easy integration.

## Installation

Install via npm:

```bash
npm install @hanakla/micetrap
```

Or via yarn:

```bash
yarn add @hanakla/micetrap
```

## Examples

### Basic Usage (Document-Level)

```typescript
import { micetrap } from "@hanakla/micetrap";

// Create an instance for the document
const mice = micetrap();

// Bind single keys to the document
mice.bind([
  { keys: "4", handler: () => console.log("Key '4' pressed") },
  { keys: "?", handler: () => console.log("Show shortcuts!") },
  {
    keys: "meta+s",
    handler: () => console.log("Saved!"),
    preventDefault: true,
  },
]);

// Bind combinations
mice.bind([
  { keys: "meta+shift+k", handler: () => console.log("Meta+Shift+K pressed") },
]);

// Unbind keys
mice.unbind("4");

// Destroy instance
mice.destroy();
```

### Basic Usage (Element-Level)

```typescript
import { micetrap } from "@hanakla/micetrap";

// Create an instance for a specific element
const inputElement = document.getElementById("my-input");
const mice = micetrap(inputElement);

// Bind single keys to the element
mice.bind([
  { keys: "a", handler: () => console.log("Key 'a' pressed on input element") },
  {
    keys: "enter",
    handler: () => console.log("Enter key pressed"),
    phase: "keyup",
  },
]);

// Unbind keys
mice.unbind("a");

// Add custom keycodes
mice.addKeycodes({ 188: "," });

// Destroy instance
mice.destroy();
```

### Using `signal` for Binding Cancellation

The `signal` option can be used to manage and cancel bindings dynamically. For instance, if you want to add temporary shortcuts during a modal dialog:

```typescript
mice.bind([
  {
    keys: "esc",
    handler: () => {
      console.log("Escape pressed, closing modal");
    },
    signal,
  },
  {
    keys: "enter",
    handler: () => console.log("Enter pressed on modal"),
    signal,
  },
]);
```

This approach ensures that bindings are cleanly removed when the modal is dismissed, avoiding memory leaks or unexpected behavior.

### Advanced: hook property

Use the `hook` property to inspect matches before they are handled:

```typescript
mice.hook = (matches) => {
  console.log("Matches found:", matches);
};
```

### React Integration

Micetrap provides React hooks for easily binding shortcuts in functional components.

```tsx
import { useDocumentMicetrap, useMicetrap } from "@hanakla/micetrap/react";

function App() {
  // useMicetrap for binding shortcuts to a specific element
  const ref = useMicetrap([
    // By default, useMicetrap stops event propagation
    { keys: "ctrl+h", handler: () => console.log("Help shortcut") },
  ]);

  // useDocumentMicetrap for binding shortcuts globally across the document
  useDocumentMicetrap([
    { keys: "esc", handler: () => console.log("Escape key globally") },
  ]);

  return (
    <div ref={ref} tabIndex={-1}>
      Press shortcuts!
    </div>
  );
}
```

## API Reference

### `Micetrap`

`Micetrap` is the core object returned by the `micetrap` function. Below are the available methods and properties:

#### Properties

- **`binds: Array<MicetrapBind>`**
  - List of all current bindings.
- **`hook: ((matches: Array<MatchResult>) => void) | null`**
  - Optional hook for inspecting shortcut matches.

#### Methods

- **`resume(): Micetrap`**
  - Resumes listening for keyboard events.
- **`pause(): Micetrap`**
  - Pauses listening for keyboard events.
- **`bind(binds: Array<MicetrapBind>): Micetrap`**
  - Adds one or more key bindings.
- **`unbind(keys: string | string[], handler?: MicetrapCallback): Micetrap`**
  - Removes key bindings for the specified keys.
- **`setTarget(target: Element | Document | null): Micetrap`**
  - Sets the target element for listening to keyboard events.
- **`handleEvent(e: KeyboardEvent, binds: Array<MicetrapBind>): void`**
  - Manually processes a keyboard event.
- **`addKeycodes(keycodes: Record<number, string>): Micetrap`**
  - Adds custom key mappings.
- **`destroy(): void`**
  - Removes all bindings and cleans up resources.

### `MicetrapBind`

The object used to define a key binding:

- **`keys: string | string[]`**
  - Key(s) to bind.
- **`handler: MicetrapCallback`**
  - Function to call when the key(s) are pressed.
- **`phase?: ActionPhase`**
  - Event phase (`keypress`, `keydown`, or `keyup`). Defaults to `keydown`.
- **`signal?: AbortSignal`**
  - Optional signal to support binding cancellation.
- **`preventDefault?: boolean`**
  - Whether to prevent the default browser action.
- **`stopPropagation?: boolean`**
  - Whether to stop the event from propagating further.

## Contributing

Contributions are welcome! Please open issues or submit pull requests to improve functionality or documentation.

## License

This library is licensed under the Apache 2.0 License. See [LICENSE](LICENSE) for details.
