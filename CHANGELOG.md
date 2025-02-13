# micetrap changelog

## 1.1.0

Correctly works! (maybe)

### 🚀 Features

<!-- prettier-ignore -->
- [Experimental] Accept ref from external<br />
  ```tsx
  // Support both ref styles

  // Support but not recommended
  const ref = useRef<HTMLDivElement>(null);
  usetMicetrap({ /* bindings */ }, { /* options */ }, ref);
  //                                                  ^^^ external ref in 3rd argument

  // Recommended
  const ref = useMicetrap({ /* bindings */ }, { /* options */ });
  ```

### 🤕 Fixed

- Incorrect (duplicate) event handling by all key events
- Fix `micetrap/react` can't be import
- Fix server sider warning by useLayoutEffect

## 1.0.0

- Initial release
