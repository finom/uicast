import { createComponentImplementation } from "@ui-fired/react";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@ui-fired/catalog/components/ui/breadcrumb";
import { BreadcrumbDef } from "./def";

export const BreadcrumbImpl = createComponentImplementation({
  def: BreadcrumbDef,
  render: ({ items = [], onNavigate, generatedKey }) => {
    return (
      <Breadcrumb data-key={generatedKey}>
        <BreadcrumbList>
          {items.map((item, i) => {
            const isLast = i === items.length - 1;
            const isActive = item.active ?? isLast;
            return (
              <BreadcrumbItem key={i}>
                {i > 0 && <BreadcrumbSeparator />}
                {isActive ? (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <button
                      type="button"
                      onClick={() =>
                        onNavigate?.({ index: i, label: item.label })
                      }
                    >
                      {item.label}
                    </button>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    );
  },
});
