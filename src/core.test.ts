import { defaultShouldStopCallback, matchCombo } from "./core";

describe("defaultShouldStopCallback", () => {
    it("should return true if the target is a textarea", () => {
        const root = element("div");
        const child = root.appendChild(element("textarea"));
        const event = keyboardEvent("s", 83, { target: child });

        expect(defaultShouldStopCallback(event, child, root)).toBe(false);
    });
});

describe("isMatchCombo", () => {
    it("test", () => {
        expect(
            matchCombo("meta+s", keyboardEvent("s", 83, { metaKey: true }))
        ).toEqual({
            complete: true,
            combo: "meta+s",
        });
    });

    it("match sequence", () => {
        expect(
            matchCombo("up up down down", keyboardEvent("ArrowUp", 38), 0)
        ).toEqual({ complete: false, combo: "up" });
        expect(
            matchCombo("up up down down", keyboardEvent("ArrowUp", 38), 1)
        ).toEqual({ complete: false, combo: "up" });
        expect(
            matchCombo("up up down down", keyboardEvent("ArrowDown", 40), 2)
        ).toEqual({ complete: false, combo: "down" });
        expect(
            matchCombo("up up down down", keyboardEvent("ArrowDown", 40), 3)
        ).toEqual({ complete: true, combo: "down" });
    });
});

function element<K extends keyof HTMLElementTagNameMap>(
    tag: K
): HTMLElementTagNameMap[K] {
    return document.createElement(tag);
}

function keyboardEvent(
    key: string,
    keyCode: number,
    {
        target,
        ...modifiers
    }: {
        target?: HTMLElement;
        metaKey?: boolean;
        ctrlKey?: boolean;
        shiftKey?: boolean;
        altKey?: boolean;
    } = {}
): KeyboardEvent {
    return Object.assign(
        new KeyboardEvent("keydown", { key, keyCode, target, ...modifiers }),
        {
            which: keyCode,
        }
    );
}
