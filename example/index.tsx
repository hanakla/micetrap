import { createRoot } from "react-dom/client";
import {} from "micetrap";
import { useDocumentMicetrap, useMicetrap } from "micetrap/react";
import { useState } from "react";

document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("root")!;
  createRoot(root).render(<App />);
});

function App() {
  const [message, setMessage] = useState<string>("");
  const [regionMessage, setRegionMessage] = useState<string>("");

  useDocumentMicetrap([
    {
      keys: "up up down down left right left right b a",
      handler: () => setMessage("Konami Code!"),
    },
    {
      keys: "q w e",
      handler: () => setMessage("Q W E"),
    },
    {
      keys: "meta+s",
      handler: (e) => {
        e.preventDefault();
        setMessage("Save? (Meta+S)");
      },
    },
    { keys: "s", handler: () => setMessage("S") },
  ]);

  const ref = useMicetrap<HTMLDivElement>([
    {
      keys: "up up down down left right left right b a",
      handler: () => setRegionMessage("Konami Code!"),
    },
    {
      keys: "q w e",
      handler: () => setRegionMessage("Q W E"),
    },
    {
      keys: "meta+s",
      handler: (e) => {
        e.preventDefault();
        setRegionMessage("Save? (Meta+S)");
      },
    },
    {
      keys: "s",
      handler: () => setRegionMessage("S"),
    },
  ]);

  console.log("render");

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mt-[8px]">Commands</h2>
      <ul className="my-4 list-disc ml-[16px]">
        <li>
          <kbd>up up down down left right left right b a</kbd>
        </li>

        <li>
          <kbd>Q W E</kbd>
        </li>

        <li>
          <kbd>meta+s</kbd>
        </li>

        <li>
          <kbd>s</kbd>
        </li>
      </ul>
      Hey: {message}
      <div
        ref={ref}
        tabIndex={-1}
        // style={{
        //     outline: "2px solid red",
        //     marginTop: "32px",
        //     padding: "16px",
        //     border: "1px solid black",
        // }}
        className="my-[32px] shadow-[0_0_0_2px_rgba(74,180,255,0.345)] focus:shadow-[0_0_0_2px_#4ab4ff]"
      >
        Regional:
        <br />
        {regionMessage}
      </div>
    </div>
  );
}
