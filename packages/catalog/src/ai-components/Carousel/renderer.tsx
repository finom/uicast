import { createAIComponentRenderer } from "ui-fired/core/render/createAIComponentRenderer";
import { Button } from "ui-fired/catalog/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Children, useState } from "react";
import { CarouselDef } from "./def";

export const CarouselRenderer = createAIComponentRenderer({
  def: CarouselDef,
  renderer: ({
    orientation = "horizontal",
    loop = false,
    children,
    generatedKey,
  }) => {
    const childArray = Children.toArray(children);
    const [current, setCurrent] = useState(0);

    const canPrev = loop || current > 0;
    const canNext = loop || current < childArray.length - 1;

    const goTo = (index: number) => {
      if (loop) {
        setCurrent(
          ((index % childArray.length) + childArray.length) % childArray.length,
        );
      } else {
        setCurrent(Math.max(0, Math.min(childArray.length - 1, index)));
      }
    };

    const isHorizontal = orientation === "horizontal";

    return (
      <div className="relative w-full" data-key={generatedKey}>
        <div className="overflow-hidden rounded-lg">
          <div
            className={`flex transition-transform duration-300 ${isHorizontal ? "" : "flex-col"}`}
            style={{
              transform: isHorizontal
                ? `translateX(-${current * 100}%)`
                : `translateY(-${current * 100}%)`,
            }}
          >
            {childArray.map((child, i) => (
              <div key={i} className="w-full shrink-0">
                {child}
              </div>
            ))}
          </div>
        </div>
        <Button
          variant="outline"
          size="icon"
          className="absolute left-2 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full"
          disabled={!canPrev}
          onClick={() => goTo(current - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full"
          disabled={!canNext}
          onClick={() => goTo(current + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  },
});
