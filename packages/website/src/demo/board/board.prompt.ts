export const boardPrompt = `Build a browser flow board from a single bespoke component, no backend.

Component (one component, TWO custom event shapes):
- NodeBoard — a canvas of draggable nodes with connection wires.
  - Dragging a node emits a spatial payload: { id, x, y } (0..1 fractions).
  - Clicking one node's port, then another's, emits a relational payload:
    { from, to }.

Wire both into one reactive "board" scope:
- Dragging updates that node's position in scopes.board.nodes.
- Connecting appends a link to scopes.board.links; the wire is drawn instantly.
- "Auto-arrange" calls a host function that lays the nodes out around a circle.
- "Clear links" removes every connection behind a confirm prompt.
- A readout shows the live node/link counts.
- A "Last event" panel shows the most recent component event, verbatim — watch
  the payload shape change between a drag and a connect.`;
