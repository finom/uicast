import { createComponentImplementation } from "@uicast/react";
import { Fragment } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../../components/ui/breadcrumb";
import { RowSkeleton } from "../../lib/skeletons";
import { BreadcrumbDef } from "./def";

export const BreadcrumbImpl = createComponentImplementation({
  def: BreadcrumbDef,
  render: ({ items, onNavigate }, { entry }) => (
    <Breadcrumb data-key={entry.key}>
      <BreadcrumbList>
        {items.map((item, i) => (
          // The separator renders its own <li>; nesting it would put li inside li.
          <Fragment key={i}>
            {i > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              {(item.active ?? i === items.length - 1) ? (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <button type="button" onClick={() => onNavigate({ index: i, label: item.label })}>
                    {item.label}
                  </button>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  ),
  skeleton: RowSkeleton,
});
