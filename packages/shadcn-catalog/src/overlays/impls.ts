import type { ComponentImplementation } from "@uicast/react";
import { ConfirmDialogImpl } from "../uicast-catalog/confirm-dialog/impl";
import { DrawerImpl } from "../uicast-catalog/drawer/impl";
import { DropdownMenuImpl } from "../uicast-catalog/dropdown-menu/impl";
import { DropdownMenuItemImpl } from "../uicast-catalog/dropdown-menu-item/impl";
import { ModalImpl } from "../uicast-catalog/modal/impl";
import { PopoverImpl } from "../uicast-catalog/popover/impl";
import { TooltipImpl } from "../uicast-catalog/tooltip/impl";

export { ConfirmDialogImpl, DrawerImpl, DropdownMenuImpl, DropdownMenuItemImpl, ModalImpl, PopoverImpl, TooltipImpl };

export const impls: ComponentImplementation[] = [
  ConfirmDialogImpl,
  DrawerImpl,
  DropdownMenuImpl,
  DropdownMenuItemImpl,
  ModalImpl,
  PopoverImpl,
  TooltipImpl,
];
