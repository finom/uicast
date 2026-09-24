import { createComponentImplementation } from "@uicast/react";
import { Fragment } from "react";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../../components/ui/breadcrumb";
import { BreadcrumbDef } from "./def";

export const BreadcrumbImpl = createComponentImplementation({
  def: BreadcrumbDef,
  render: ({ items, onNavigate }, { entry }) => {
    return (
      <Breadcrumb data-key={entry.key}>
        <BreadcrumbList>
          {items.map((item, i) => {
            const isLast = i === items.length - 1;
            const isActive = item.active ?? isLast;
            return (
              // The separator renders its own <li>; nesting it would put li inside li.
              <Fragment key={i}>
                {i > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  {isActive ? (
                    <BreadcrumbPage>{item.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <button
                        type="button"
                        onClick={() =>
                          onNavigate({ index: i, label: item.label })
                        }
                      >
                        {item.label}
                      </button>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    );
  },
  skeleton: ({ children }) => <div className="flex flex-row items-center gap-2">{children}</div>,
});
