// biome-ignore-all format: one entry per line, as in a document
import type { Example } from ".";

export const navigation: Record<string, Example> = {
  Breadcrumb: [
    { key: "bc-wrap", component: "FlexCol", props: { literal: { gap: "2" } }, seed: [{ set: "scopes.root.crumbs", literal: ["Orders", "#4821", "Shipping"] }, { set: "scopes.root.activeIndex", literal: 2 }], children: ["bc", "bc-status"] },
    { key: "bc", component: "Breadcrumb", props: { expr: "({ items: scopes.root.crumbs.map((label, i) => ({ label, active: i === scopes.root.activeIndex })) })" }, callbacks: { onNavigate: [{ set: "scopes.root.activeIndex", expr: "evt.index" }] } },
    { key: "bc-status", component: "Typography", props: { expr: "({ text: 'Viewing: ' + scopes.root.crumbs[scopes.root.activeIndex], variant: 'muted' })" } },
  ],
  CommandMenu: [
    { key: "cmd-wrap", component: "FlexCol", props: { literal: { gap: "2", align: "start" } }, seed: [{ set: "scopes.root.open", literal: false }, { set: "scopes.root.lastSelected", literal: null }], children: ["cmd-open", "cmd", "cmd-status"] },
    { key: "cmd-open", component: "Button", props: { literal: { text: "Open command menu", variant: "outline" } }, callbacks: { onClick: [{ set: "scopes.root.open", literal: true }] } },
    { key: "cmd", component: "CommandMenu", props: { expr: "({ open: scopes.root.open, placeholder: 'Type a command or search...', groups: [{ heading: 'Go to', items: [{ label: 'Orders', icon: 'ShoppingCart' }, { label: 'Products', icon: 'Package' }, { label: 'Customers', icon: 'Users' }, { label: 'Suppliers', icon: 'Truck' }] }, { heading: 'Actions', items: [{ label: 'New order', icon: 'Plus', shortcut: ['Cmd', 'N'] }] }] })" }, callbacks: { onOpenChange: [{ set: "scopes.root.open", expr: "evt.open" }], onSelect: [{ set: "scopes.root.lastSelected", expr: "evt.label" }, { set: "scopes.root.open", literal: false }] } },
    { key: "cmd-status", component: "Typography", props: { expr: "({ text: scopes.root.lastSelected ? ('You picked: ' + scopes.root.lastSelected) : 'Nothing selected yet.', variant: 'muted' })" } },
  ],
  Link: [
    { key: "link-wrap", component: "FlexCol", props: { literal: { gap: "1" } }, children: ["link-catalog", "link-prompt"] },
    { key: "link-catalog", component: "Link", props: { literal: { text: "Browse the component catalog", href: "/react/reference-catalog" } } },
    { key: "link-prompt", component: "Link", props: { literal: { text: "Read the prompt contract", href: "/prompt", variant: "muted", size: "sm" } } },
  ],
  NavigationMenu: [
    { key: "nav-wrap", component: "FlexCol", props: { literal: { gap: "2" } }, seed: [{ set: "scopes.root.lastLabel", literal: null }, { set: "scopes.root.lastParent", literal: null }], children: ["nav-menu", "nav-page"] },
    { key: "nav-menu", component: "NavigationMenu", props: { literal: { items: [{ label: "Orders" }, { label: "Catalog", children: [{ label: "Products", description: "Browse and edit product listings" }, { label: "Suppliers", description: "Manage supplier records and contacts" }, { label: "Categories", description: "Group products for the storefront and reports" }] }, { label: "Reports" }] } }, callbacks: { onNavigate: [{ set: "scopes.root.lastLabel", expr: "evt.label" }, { set: "scopes.root.lastParent", expr: "evt.parentLabel ?? null" }] } },
    { key: "nav-page", component: "EmptyState", props: { expr: "({ title: scopes.root.lastLabel ?? 'No page opened', description: scopes.root.lastParent ? 'Opened from ' + scopes.root.lastParent + '.' : scopes.root.lastLabel ? 'Opened from the menu bar.' : 'Pick a page from the menu above.' })" } },
  ],
  Pagination: [
    { key: "pg-wrap", component: "FlexCol", props: { literal: { gap: "2" } }, seed: [{ set: "scopes.root.page", literal: 1 }, { set: "scopes.root.totalItems", literal: 214 }, { set: "scopes.root.pageSize", literal: 20 }, { set: "scopes.root.logPage", literal: 1 }], children: ["pg-status", "pg", "log-status", "log-pg"] },
    { key: "pg-status", component: "Typography", props: { expr: "({ text: 'Showing orders ' + ((scopes.root.page - 1) * scopes.root.pageSize + 1) + '-' + Math.min(scopes.root.page * scopes.root.pageSize, scopes.root.totalItems) + ' of ' + scopes.root.totalItems, variant: 'muted' })" } },
    { key: "pg", component: "Pagination", props: { expr: "({ currentPage: scopes.root.page, totalPages: Math.ceil(scopes.root.totalItems / scopes.root.pageSize) })" }, callbacks: { onPageChange: [{ set: "scopes.root.page", expr: "evt.page" }] } },
    { key: "log-status", component: "Typography", props: { expr: "({ text: 'Activity log, page ' + scopes.root.logPage + ', total unknown', variant: 'muted' })" } },
    { key: "log-pg", component: "Pagination", props: { expr: "({ currentPage: scopes.root.logPage, hasNext: scopes.root.logPage < 3 })" }, callbacks: { onPageChange: [{ set: "scopes.root.logPage", expr: "evt.page" }] } },
  ],
  Sidebar: [
    { key: "sidebar", component: "Sidebar", seed: [{ set: "scopes.root.activeLabel", literal: "Orders" }, { set: "scopes.root.collapsed", literal: false }], props: { expr: "({ collapsed: scopes.root.collapsed, sections: [{ title: 'Workspace', items: [{ label: 'Orders', icon: 'ShoppingCart', badge: '12', active: scopes.root.activeLabel === 'Orders' }, { label: 'Products', icon: 'Package', active: scopes.root.activeLabel === 'Products' }, { label: 'Customers', icon: 'Users', active: scopes.root.activeLabel === 'Customers' }, { label: 'Suppliers', icon: 'Truck', active: scopes.root.activeLabel === 'Suppliers' }] }, { title: 'Insights', items: [{ label: 'Reports', icon: 'BarChart3', active: scopes.root.activeLabel === 'Reports' }] }] })" }, callbacks: { onNavigate: [{ set: "scopes.root.activeLabel", expr: "evt.label" }], onToggleCollapse: [{ set: "scopes.root.collapsed", expr: "evt.collapsed" }] } },
  ],
  Stepper: [
    { key: "step-wrap", component: "FlexCol", props: { literal: { gap: "2" } }, seed: [{ set: "scopes.root.currentStep", literal: 1 }, { set: "scopes.root.stepLabels", literal: ["Cart", "Shipping", "Payment", "Review"] }], children: ["stepper", "step-status", "step-continue"] },
    { key: "stepper", component: "Stepper", props: { expr: "({ steps: [{ label: 'Cart' }, { label: 'Shipping', description: 'Address & method' }, { label: 'Payment', description: 'Card details' }, { label: 'Review' }], currentStep: scopes.root.currentStep })" }, callbacks: { onStepClick: [{ set: "scopes.root.currentStep", expr: "evt.step" }] } },
    { key: "step-status", component: "Typography", props: { expr: "({ text: 'Step ' + (scopes.root.currentStep + 1) + ' of 4: ' + scopes.root.stepLabels[scopes.root.currentStep], variant: 'muted' })" } },
    { key: "step-continue", component: "Button", props: { expr: "({ text: 'Continue', size: 'sm', disabled: scopes.root.currentStep >= 3 })" }, callbacks: { onClick: [{ set: "scopes.root.currentStep", expr: "Math.min(currentValue + 1, 3)" }] } },
  ],
};