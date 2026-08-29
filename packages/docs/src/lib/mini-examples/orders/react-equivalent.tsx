// The same UI, written by hand in React.
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type Order = { id: number; customer: string; total: number };

const listOrders = (): Promise<Order[]> =>
  fetch("/api/orders").then((res) => res.json());

export function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const refresh = useCallback(() => listOrders().then(setOrders), []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <Card className="w-64">
      <CardContent className="grid gap-2">
        <div className="font-semibold">{orders.length} orders</div>
        <Button variant="outline" size="sm" className="justify-self-start" onClick={refresh}>
          Refresh
        </Button>
        {orders.map((order) => (
          <div key={order.id} className="flex justify-between border-t pt-1 text-sm">
            <span>{order.customer}</span>
            <span className="text-muted-foreground">${order.total}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
