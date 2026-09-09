const keys = new Set();

const KEY_MAP = {
  KeyW: "up",
  ArrowUp: "up",
  KeyS: "down",
  ArrowDown: "down",
  KeyA: "left",
  ArrowLeft: "left",
  KeyD: "right",
  ArrowRight: "right",
  Digit1: "one",
  Digit2: "two",
  Digit3: "three",
};

export function initInput() {
  window.addEventListener("keydown", (e) => {
    const action = KEY_MAP[e.code];
    if (!action) return;
    e.preventDefault();
    keys.add(action);
  });

  window.addEventListener("keyup", (e) => {
    const action = KEY_MAP[e.code];
    if (!action) return;
    keys.delete(action);
  });

  window.addEventListener("blur", () => keys.clear());
}

export function getMoveVector() {
  let x = 0;
  let y = 0;
  if (keys.has("left")) x -= 1;
  if (keys.has("right")) x += 1;
  if (keys.has("up")) y -= 1;
  if (keys.has("down")) y += 1;
  return { x, y };
}

export function consumeChoiceKey() {
  if (keys.has("one")) {
    keys.delete("one");
    return 0;
  }
  if (keys.has("two")) {
    keys.delete("two");
    return 1;
  }
  if (keys.has("three")) {
    keys.delete("three");
    return 2;
  }
  return -1;
}
