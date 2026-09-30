import { createComponentImplementation } from "@uicast/react";
import { Children, useEffect, useState } from "react";
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../../components/ui/carousel";
import { BlockSkeleton } from "../../lib/skeletons";
import { CarouselDef } from "./def";

export const CarouselImpl = createComponentImplementation({
  def: CarouselDef,
  render: ({ orientation, loop, children }, { entry }) => {
    const [api, setApi] = useState<CarouselApi>();
    const [height, setHeight] = useState<number>();
    const vertical = orientation === "vertical";

    // A vertical viewport needs a height: the tallest slide's content plus the slide's top padding.
    useEffect(() => {
      if (!api || !vertical) return;
      const observer = new ResizeObserver(() => {
        const heights = api
          .slideNodes()
          .map(
            (slide) =>
              (slide.firstElementChild as HTMLElement).offsetHeight +
              Number.parseFloat(getComputedStyle(slide).paddingTop),
          );
        setHeight(Math.max(0, ...heights));
      });
      const observe = () => {
        observer.disconnect();
        for (const slide of api.slideNodes()) observer.observe(slide.firstElementChild as HTMLElement);
      };
      observe();
      api.on("reInit", observe);
      return () => {
        observer.disconnect();
        api.off("reInit", observe);
      };
    }, [api, vertical]);

    // The arrows sit outside the slides, in the wrapper's padding; `p-1` keeps a slide's ring clear of the viewport's clip.
    return (
      <div className={vertical ? "py-12" : "px-12"} data-key={entry.key}>
        <Carousel orientation={orientation} opts={{ loop }} setApi={setApi}>
          <CarouselContent style={vertical && height ? { height } : undefined}>
            {Children.toArray(children).map((slide, i) => (
              <CarouselItem key={i}>
                <div className="p-1">{slide}</div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
    );
  },
  skeleton: () => <BlockSkeleton height={240} />,
});
