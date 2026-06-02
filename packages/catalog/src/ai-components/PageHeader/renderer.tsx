import { createAIComponentRenderer } from "@ui-fired/core/render/createAIComponentRenderer";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@ui-fired/catalog/components/ui/breadcrumb";
import { PageHeaderDef } from "./def";

export const PageHeaderRenderer = createAIComponentRenderer({
  def: PageHeaderDef,
  renderer: ({
    title,
    description,
    breadcrumbs,
    children,
    onBreadcrumbClick,
    generatedKey,
  }) => {
    return (
      <div className="space-y-2 pb-4" data-key={generatedKey}>
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
                          onBreadcrumbClick?.({ index: i, label: bc.label });
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
});
