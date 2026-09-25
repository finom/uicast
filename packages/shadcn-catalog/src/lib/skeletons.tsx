import type { ReactNode } from "react";
import { Skeleton } from "../components/ui/skeleton";

type Children = { children?: ReactNode };

// A bar at the component's usual height, for a component drawn from data rather than children.
export const blockSkeleton = (height: number) => () => <Skeleton className="w-full" style={{ height }} />;

export const StackSkeleton = ({ children }: Children) => <div className="flex flex-col gap-2">{children}</div>;

export const RowSkeleton = ({ children }: Children) => <div className="flex flex-row items-center gap-2">{children}</div>;

// A bordered box: the title, or a bar in its place, over the children's skeletons.
export const PanelSkeleton = ({ title, children }: Children & { title?: ReactNode }) => (
  <div className="flex flex-col gap-3 rounded-lg border p-4">
    {title || <Skeleton className="h-4 w-40" />}
    {children}
  </div>
);
