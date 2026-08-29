import { createComponentImplementation } from "@uicast/react";
import { Button as UIButton } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ButtonDef, CardDef, HeadingDef, OrderRowDef } from "./def";

// card/impl.tsx
export const CardImpl = createComponentImplementation({
  def: CardDef,
  render: ({ children }) => (
    <Card className="w-64">
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
    <UIButton
      variant="outline"
      size="sm"
      className="justify-self-start"
      onClick={() => onClick()}
    >
      {label}
    </UIButton>
  ),
});

// order-row/impl.tsx
export const OrderRowImpl = createComponentImplementation({
  def: OrderRowDef,
  render: ({ customer, total }) => (
    <div className="flex justify-between border-t pt-1 text-sm">
      <span>{customer}</span>
      <span className="text-muted-foreground">${total}</span>
    </div>
  ),
});
