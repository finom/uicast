/**
 * The request that "generated" the inventory app — shown next to the Play
 * button so the demo reads as prompt → streamed UI. Written the way a person
 * actually types: the schemas and functions arrive through the assembled
 * prompt, not through the user's message. No model is actually called.
 */
export const inventoryPrompt = `Build me an inventory dashboard for our product catalog. Big numbers up top — how many products we carry, what's running low, what all the stock is worth — then a bar chart of stock by category, and a searchable table of every product underneath.

I need to add new products, edit existing ones, and delete them — but ask before deleting, I have butter fingers. And when I change something, the numbers and the chart should update too, not just the table.

Products have a name, SKU, category, stock count, and price.`;
