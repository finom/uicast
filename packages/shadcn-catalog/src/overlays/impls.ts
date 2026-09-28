import type { ComponentImplementation } from "@uicast/react";
import { DropdownMenuImpl } from "../uicast-catalog/dropdown-menu/impl";
import { DropdownMenuItemImpl } from "../uicast-catalog/dropdown-menu-item/impl";
import { ModalImpl } from "../uicast-catalog/modal/impl";
import { PopoverImpl } from "../uicast-catalog/popover/impl";
import { TooltipImpl } from "../uicast-catalog/tooltip/impl";

export { DropdownMenuImpl, DropdownMenuItemImpl, ModalImpl, PopoverImpl, TooltipImpl };

export const impls: ComponentImplementation[] = [
  DropdownMenuImpl,
  DropdownMenuItemImpl,
  ModalImpl,
  PopoverImpl,
  TooltipImpl,
];
