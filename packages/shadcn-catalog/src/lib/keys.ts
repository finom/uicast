// biome-ignore-all format: the lists are grouped by kind, one group per line
import z from "zod";

// One spelling per key: a model given "Cmd", "⌘" and "Meta" would mix them.
const KEY_NAMES = [
  "Cmd", "Ctrl", "Alt", "Shift", "Enter", "Tab", "Esc", "Space", "Backspace", "Delete",
  "Up", "Down", "Left", "Right", "PageUp", "PageDown", "Home", "End",
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M",
  "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
  "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
  "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12",
  "/", ",", ".", "?",
] as const;

export const keyNameSchema = z.enum(KEY_NAMES).meta({ id: "KeyName" });
