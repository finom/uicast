import type { IconName } from "./icons";
import { ICONS } from "./icons";

// The one place a document's icon name becomes an element. `className` sizes it per call site.
export const iconNode = (name: IconName | undefined, className: string) => {
	if (!name) return null;
	const Icon = ICONS[name];
	return <Icon className={className} />;
};
