import type { ComponentDefinition } from "@uicast/core";
import { BreadcrumbDef } from "../uicast-catalog/breadcrumb/def";
import { CommandMenuDef } from "../uicast-catalog/command-menu/def";
import { LinkDef } from "../uicast-catalog/link/def";
import { NavigationMenuDef } from "../uicast-catalog/navigation-menu/def";
import { PaginationDef } from "../uicast-catalog/pagination/def";
import { SidebarDef } from "../uicast-catalog/sidebar/def";
import { StepperDef } from "../uicast-catalog/stepper/def";

export { BreadcrumbDef, CommandMenuDef, LinkDef, NavigationMenuDef, PaginationDef, SidebarDef, StepperDef };

export const defs: ComponentDefinition[] = [
  BreadcrumbDef,
  CommandMenuDef,
  LinkDef,
  NavigationMenuDef,
  PaginationDef,
  SidebarDef,
  StepperDef,
];
