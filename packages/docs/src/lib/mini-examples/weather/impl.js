import { createComponentImplementation } from "@uicast/react";
import { Card, CardContent } from "@uicast/shadcn-catalog/ui/card";
import { WeatherCardDef } from "./def";

const CITIES = ["Amsterdam", "Tokyo", "Oslo"];

export const WeatherCardImpl = createComponentImplementation({
  def: WeatherCardDef,
  render: ({ city, tempC, condition, onCity }) => (
    <Card className="w-55">
      <CardContent className="grid gap-3 text-center">
        <select
          className="justify-self-center rounded-md border border-input bg-transparent px-2 py-1 text-sm"
          value={city}
          onChange={(e) => onCity({ city: e.target.value })}
        >
          {CITIES.map((name) => (
            <option key={name}>{name}</option>
          ))}
        </select>
        {tempC === undefined ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : (
          <>
            <div className="text-3xl font-semibold">{tempC}°C</div>
            <div className="text-sm text-muted-foreground">{condition}</div>
          </>
        )}
      </CardContent>
    </Card>
  ),
});
