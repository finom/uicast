import type { ComponentDefinition } from "@uicast/core";
import { ConfirmDialogDef } from "../uicast-catalog/confirm-dialog/def";
import { DrawerDef } from "../uicast-catalog/drawer/def";
import { DropdownMenuDef } from "../uicast-catalog/dropdown-menu/def";
import { DropdownMenuItemDef } from "../uicast-catalog/dropdown-menu-item/def";
import { ModalDef } from "../uicast-catalog/modal/def";
import { PopoverDef } from "../uicast-catalog/popover/def";
import { TooltipDef } from "../uicast-catalog/tooltip/def";

export {
  ConfirmDialogDef,
  DrawerDef,
  DropdownMenuDef,
  DropdownMenuItemDef,
  ModalDef,
  PopoverDef,
  TooltipDef,
};

export const defs: ComponentDefinition[] = [
  ConfirmDialogDef,
  DrawerDef,
  DropdownMenuDef,
  DropdownMenuItemDef,
  ModalDef,
  PopoverDef,
  TooltipDef,
];
