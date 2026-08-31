// Shared event payload schemas. Each carries a JSON Schema `$id`, so a catalog
// component's callback that uses one is hoisted into the prompt's
// `# Common Events` block automatically — see `getComponentsPartialPrompt`.
export { mouseEventSchema } from "./mouse";
export { keyboardEventSchema } from "./keyboard";
