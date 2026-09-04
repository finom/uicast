import { createComponentImplementation, type PlaceholderComponentProps } from "@uicast/react";
import { Skeleton } from "../../components/ui/skeleton";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../../components/ui/breadcrumb";
import { PageHeaderDef } from "./def";

export const PageHeaderImpl = createComponentImplementation({
  def: PageHeaderDef,
  render: ({
    title,
    description,
    breadcrumbs,
    children,
    onBreadcrumbClick,
  }, { entry }) => {
    return (
      <div className="space-y-2 pb-4" data-key={entry.key}>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbs.map((bc, i) => {
                const isLast = i === breadcrumbs.length - 1;
                return (
                  <BreadcrumbItem key={i}>
                    {i > 0 && <BreadcrumbSeparator />}
                    {isLast ? (
                      <BreadcrumbPage>{bc.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          onBreadcrumbClick({ index: i, label: bc.label });
                        }}
                      >
                        {bc.label}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                );
              })}
            </BreadcrumbList>
          </Breadcrumb>
        )}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            {description && (
              <p className="text-muted-foreground">{description}</p>
            )}
          </div>
          {children && (
            <div className="flex items-center gap-2">{children}</div>
          )}
        </div>
      </div>
    );
  },
  placeholder: ({ children }: PlaceholderComponentProps) => (
    <div className="flex flex-col gap-3 rounded-lg border p-4">
      <Skeleton className="h-4 w-40" />
      {children}
    </div>
  ),
});
