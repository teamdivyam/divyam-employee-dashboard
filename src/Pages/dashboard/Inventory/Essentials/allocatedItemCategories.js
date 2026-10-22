import { categoryOptions } from "./data/requirementCategories.js";

// Inventory V2 stores category identity as its exact string, not a category ID.
// Reorder display references only; never merge allocation lines or alter payloads.
export function allocatedItemsByCategory(rows, options = categoryOptions) {
  const ranks = new Map(options.map((option, index) => [option.value, index]));
  const groups = new Map();
  for (const row of rows) {
    const category = row.category || "";
    if (!groups.has(category)) groups.set(category, []);
    groups.get(category).push(row);
  }
  return [...groups].sort(([a], [b]) =>
    (ranks.get(a) ?? options.length) - (ranks.get(b) ?? options.length)
    || a.localeCompare(b, "en", { sensitivity: "variant" })
  ).flatMap(([, entries]) => entries);
}
