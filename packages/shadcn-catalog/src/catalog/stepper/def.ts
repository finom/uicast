import z from "zod";
import { createComponentDefinition } from "uicast";

export const StepperDef = createComponentDefinition({
  name: "Stepper",
  description:
    "A stepper/wizard component showing progress through a multi-step process. Displays numbered steps with labels, highlighting the current step and indicating completed/upcoming steps. Use Stepper for multi-step forms, onboarding wizards, checkout flows, or any sequential process.",
  props: z.strictObject({
    steps: z
      .array(
        z.object({
          label: z.string().meta({ description: "The step label text" }),
          description: z.string().optional().meta({
            description: "Optional description text below the step label",
          }),
        }),
      )
      .meta({ description: "Array of step definitions" }),
    currentStep: z.number().default(0).meta({
      description: "The zero-based index of the current active step",
    }),
    orientation: z
      .enum(["horizontal", "vertical"])
      .default("horizontal")
      .meta({ description: "Layout direction of the stepper" }),
  }),
  callbacks: {
    onStepClick: z
      .object({
        step: z.number().meta({
          description: "The zero-based index of the clicked step",
        }),
      })
      .meta({
        description: "Callback when a step is clicked for navigation",
      }),
  },
});
