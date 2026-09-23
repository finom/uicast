import type { IconName } from "./icons";
import { ICONS } from "./icons";

export const iconNode = (name: IconName | undefined, className: string) => {
	if (!name) return null;
	const Icon = ICONS[name];
	return <Icon className={className} />;
};
