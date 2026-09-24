import type { ComponentImplementation } from "@uicast/react";
import { BreadcrumbImpl } from "../uicast-catalog/breadcrumb/impl";
import { CommandMenuImpl } from "../uicast-catalog/command-menu/impl";
import { LinkImpl } from "../uicast-catalog/link/impl";
import { NavigationMenuImpl } from "../uicast-catalog/navigation-menu/impl";
import { PaginationImpl } from "../uicast-catalog/pagination/impl";
import { SidebarImpl } from "../uicast-catalog/sidebar/impl";
import { StepperImpl } from "../uicast-catalog/stepper/impl";

export {
  BreadcrumbImpl,
  CommandMenuImpl,
  LinkImpl,
  NavigationMenuImpl,
  PaginationImpl,
  SidebarImpl,
  StepperImpl,
};

export const impls: ComponentImplementation[] = [
  BreadcrumbImpl,
  CommandMenuImpl,
  LinkImpl,
  NavigationMenuImpl,
  PaginationImpl,
  SidebarImpl,
  StepperImpl,
];
