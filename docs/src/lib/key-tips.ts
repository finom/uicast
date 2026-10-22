// What each entry field does, shown on hover over a key in a highlighted document.
export const KEY_TIPS: Record<string, string> = {
  key: "Unique id for this element.",
  component: "Which registered component this entry renders.",
  seed: "Initializes scope state once, when the element mounts.",
  props: "Props for the component: a literal value or an expr.",
  hidden: "Bare expression — the element hides when it is truthy.",
  callbacks: "Event handlers; their assignments run on user actions.",
  children: "Keys of child elements, in render order.",
  each: "List source — the array this element iterates over.",
  as: "Names each item's two scopes: the item and its row.",
  keyBy: "Item field used as the stable key for list items.",
  set: "The scope path this assignment writes to.",
  expr: "A JavaScript expression, evaluated against scope.",
  literal: "A value used verbatim — never evaluated.",
  confirm: "Prompts the user to confirm before the assignment runs.",
  onClick: "An event handler; its assignments run on click.",
};
