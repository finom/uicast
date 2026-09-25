import { createComponentImplementation } from "@uicast/react";
import { Button as UIButton } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ButtonDef, CardDef, EditDialogDef, HeadingDef, ProductRowDef } from "./def";

// card/impl.tsx
export const CardImpl = createComponentImplementation({
  def: CardDef,
  render: ({ children }, { loading }) => (
    <Card className={loading ? "w-72 animate-pulse opacity-60" : "w-72"} aria-busy={loading || undefined}>
      <CardContent className="grid gap-2">{children}</CardContent>
    </Card>
  ),
});

// heading/impl.tsx
export const HeadingImpl = createComponentImplementation({
  def: HeadingDef,
  render: ({ text }) => <div className="font-semibold">{text}</div>,
});

// button/impl.tsx
export const ButtonImpl = createComponentImplementation({
  def: ButtonDef,
  render: ({ label, onClick }) => (
    <UIButton variant="outline" size="sm" className="justify-self-start" onClick={() => onClick()}>
      {label}
    </UIButton>
  ),
});

// product-row/impl.tsx
export const ProductRowImpl = createComponentImplementation({
  def: ProductRowDef,
  render: ({ name, price, qty, onQtyChange, onEdit }) => (
    <div className="flex items-center gap-2 border-t pt-1 text-sm">
      <span className="truncate">{name}</span>
      <UIButton variant="ghost" size="sm" className="mr-auto h-6 px-1.5" onClick={() => onEdit()}>
        ✎
      </UIButton>
      <span className="w-12 text-right text-muted-foreground">${price} ×</span>
      <input
        type="number"
        min={0}
        value={qty}
        onChange={(e) => onQtyChange({ value: e.target.valueAsNumber || 0 })}
        className="w-14 rounded border bg-transparent px-1 py-0.5 text-right"
      />
    </div>
  ),
});

// edit-dialog/impl.tsx
export const EditDialogImpl = createComponentImplementation({
  def: EditDialogDef,
  render: ({ name, price, onNameChange, onPriceChange, onSave, onCancel }) => (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40">
      <div className="grid w-64 gap-2 rounded-lg border bg-background p-4 shadow-lg">
        <div className="font-semibold">Edit product</div>
        <input
          value={name}
          onChange={(e) => onNameChange({ value: e.target.value })}
          className="rounded border bg-transparent px-2 py-1 text-sm"
        />
        <div className="flex items-center gap-1 text-sm">
          <span className="text-muted-foreground">$</span>
          <input
            type="number"
            min={0}
            value={price}
            onChange={(e) => onPriceChange({ value: e.target.valueAsNumber || 0 })}
            className="flex-1 rounded border bg-transparent px-2 py-1"
          />
        </div>
        <div className="flex justify-end gap-2">
          <UIButton variant="outline" size="sm" onClick={() => onCancel()}>
            Cancel
          </UIButton>
          <UIButton size="sm" onClick={() => onSave()}>
            Save
          </UIButton>
        </div>
      </div>
    </div>
  ),
});
