import type { ReactNode } from "react";
import * as all from "@uicast/shadcn-catalog/all/defs";
import * as charts from "@uicast/shadcn-catalog/charts/defs";
import * as content from "@uicast/shadcn-catalog/content/defs";
import * as data from "@uicast/shadcn-catalog/data/defs";
import * as essential from "@uicast/shadcn-catalog/essential/defs";
import * as forms from "@uicast/shadcn-catalog/forms/defs";
import * as layout from "@uicast/shadcn-catalog/layout/defs";
import * as navigation from "@uicast/shadcn-catalog/navigation/defs";
import * as overlays from "@uicast/shadcn-catalog/overlays/defs";

// Read from the registries, so the page follows the catalog.
const GROUPS = { all, essential, layout, content, data, charts, forms, navigation, overlays };

type Group = keyof typeof GROUPS;

const namesOf = (group: Group) => GROUPS[group].defs.map((def) => def.name).sort();

export function GroupSize({ group }: { group: Group }) {
  return namesOf(group).length;
}

// Closed, the summary; open, every component in the group.
export function GroupNames({ group, children }: { group: Group; children: ReactNode }) {
  return (
    <details>
      <summary className="cursor-pointer">{children}</summary>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{namesOf(group).join(", ")}</p>
    </details>
  );
}
