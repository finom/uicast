// Shown on the replays page; no model is called.
export const boardPrompt = `Set up a flow board with my NodeBoard component. Five nodes — Idea, Research, Draft, Review, Ship — with idea → research → draft → ship wired up already. Leave Review floating, I'll wire it in myself: I drag nodes to move them and click two ports to connect them.

Add an auto-arrange button that lays everything out in a circle, and a "clear links" button that asks before removing the wires. Show a small node/connection count too.

One more thing: display the last event payload on screen. Dragging and connecting emit differently shaped events and I want to eyeball both.`;
