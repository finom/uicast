import { createComponentImplementation } from "@uicast/react";
import { Skeleton } from "../../components/ui/skeleton";
import { Button } from "../../components/ui/button";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react";
import { Children, useState } from "react";
import { CarouselDef } from "./def";

const LAYOUTS = {
  horizontal: {
    translate: "translateX",
    Prev: ChevronLeft,
    Next: ChevronRight,
    prevClass: "left-2 top-1/2 -translate-y-1/2",
    nextClass: "right-2 top-1/2 -translate-y-1/2",
  },
  vertical: {
    translate: "translateY",
    Prev: ChevronUp,
    Next: ChevronDown,
    prevClass: "top-2 left-1/2 -translate-x-1/2",
    nextClass: "bottom-2 left-1/2 -translate-x-1/2",
  },
} as const;

// Keeps the ring or shadow of a neighbouring slide out of view at the viewport's edge.
const SLIDE_GAP = "1rem";

export const CarouselImpl = createComponentImplementation({
  def: CarouselDef,
  render: ({
    orientation,
    loop,
    children,
  }, { entry }) => {
    const slides = Children.toArray(children);
    const [current, setCurrent] = useState(0);
    const { translate, Prev, Next, prevClass, nextClass } = LAYOUTS[orientation];

    const count = slides.length;
    // A list can shrink under the carousel; the index never points past the last slide.
    const index = Math.min(current, Math.max(0, count - 1));
    const canPrev = count > 1 && (loop || index > 0);
    const canNext = count > 1 && (loop || index < count - 1);
    // Wraps for `loop`; without it the buttons are disabled at either end.
    const goTo = (target: number) => setCurrent((target + count) % count);

    return (
      <div className="relative w-full" data-key={entry.key}>
        {/* All slides share one grid cell: the viewport is as tall as the tallest, and a step moves a slide by its own size. */}
        <div className="grid overflow-hidden rounded-lg p-px">
          {slides.map((slide, i) => (
            <div
              key={i}
              className="col-start-1 row-start-1 transition-transform duration-300"
              style={{ transform: `${translate}(calc(${i - index} * (100% + ${SLIDE_GAP})))` }}
              inert={i !== index}
            >
              {slide}
            </div>
          ))}
        </div>
        <Button
          variant="outline"
          size="icon"
          aria-label="Previous slide"
          className={`absolute ${prevClass} size-8 rounded-full`}
          disabled={!canPrev}
          onClick={() => goTo(index - 1)}
        >
          <Prev className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          aria-label="Next slide"
          className={`absolute ${nextClass} size-8 rounded-full`}
          disabled={!canNext}
          onClick={() => goTo(index + 1)}
        >
          <Next className="size-4" />
        </Button>
      </div>
    );
  },
  placeholder: () => <Skeleton className="w-full" style={{ height: 240 }} />,
});
