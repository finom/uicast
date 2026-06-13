import { createComponentImplementation } from "@ui-fired/react";
import { Button } from "@ui-fired/catalog/components/ui/button";
import { Separator } from "@ui-fired/catalog/components/ui/separator";
import { Check } from "lucide-react";
import { cn } from "@ui-fired/catalog/lib/utils";
import { StepperDef } from "./def";

export const StepperImpl = createComponentImplementation({
  def: StepperDef,
  render: ({
    steps = [],
    currentStep = 0,
    orientation = "horizontal",
    onStepClick,
    generatedKey,
  }) => {
    const isHorizontal = orientation === "horizontal";
    return (
      <div
        className={cn(
          "flex gap-0",
          isHorizontal ? "flex-row items-start" : "flex-col",
        )}
        data-key={generatedKey}
      >
        {steps.map((step, i) => {
          const isCompleted = i < currentStep;
          const isCurrent = i === currentStep;
          const isLast = i === steps.length - 1;

          return (
            <div
              key={i}
              className={cn(
                "flex",
                isHorizontal
                  ? "flex-col items-center flex-1"
                  : "flex-row items-start pb-8 last:pb-0",
              )}
            >
              <div
                className={cn(
                  "flex items-center",
                  isHorizontal ? "flex-row w-full" : "flex-col mr-4",
                )}
              >
                {/* Connector before */}
                {i > 0 && (
                  <Separator
                    orientation={isHorizontal ? "horizontal" : "vertical"}
                    className={cn(
                      isHorizontal ? "flex-1 h-0.5" : "w-0.5 flex-1 min-h-4",
                      isCompleted ? "bg-primary" : "bg-border",
                    )}
                  />
                )}

                {/* Step circle */}
                <Button
                  variant={isCompleted ? "default" : "outline"}
                  size="icon"
                  className={cn(
                    "shrink-0 rounded-full size-8",
                    isCurrent && "border-2 border-primary text-primary",
                    !isCompleted && !isCurrent && "text-muted-foreground",
                  )}
                  onClick={() => onStepClick?.({ step: i })}
                >
                  {isCompleted ? <Check className="size-4" /> : i + 1}
                </Button>

                {/* Connector after */}
                {!isLast && isHorizontal && (
                  <Separator
                    className={cn(
                      "flex-1 h-0.5",
                      isCompleted ? "bg-primary" : "bg-border",
                    )}
                  />
                )}
              </div>

              {/* Label */}
              <div
                className={cn(isHorizontal ? "text-center mt-2 px-1" : "pt-1")}
              >
                <p
                  className={cn(
                    "text-sm font-medium",
                    isCurrent ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {step.label}
                </p>
                {step.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  },
});
