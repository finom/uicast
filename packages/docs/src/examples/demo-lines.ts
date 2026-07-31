import type { ComponentEntry } from "@uicast/core";

export const demoLines: ComponentEntry[] = [
  {
    key: "root",
    component: "FlexCol",
    props: { literal: { gap: "6" } },
    seed: [
      { set: "scopes.root.users", expr: "UserApi_getUsers()" },
      { set: "scopes.root.tasks", expr: "TaskApi_getTasks()" },
      { set: "scopes.root.activeTab", literal: "tasks" },
      { set: "scopes.root.searchTerm", literal: "" },
      { set: "scopes.root.showAddTask", literal: false },
      { set: "scopes.root.showAddUser", literal: false },
      { set: "scopes.root.newTaskTitle", literal: "" },
      { set: "scopes.root.newTaskDesc", literal: "" },
      { set: "scopes.root.newTaskStatus", literal: "TODO" },
      { set: "scopes.root.newTaskUserId", literal: "" },
      { set: "scopes.root.newUserName", literal: "" },
      { set: "scopes.root.newUserEmail", literal: "" },
      { set: "scopes.root.showEditTask", literal: false },
      { set: "scopes.root.editTaskId", literal: "" },
      { set: "scopes.root.editTaskTitle", literal: "" },
      { set: "scopes.root.editTaskDesc", literal: "" },
      { set: "scopes.root.editTaskStatus", literal: "TODO" },
      { set: "scopes.root.editTaskUserId", literal: "" },
      { set: "scopes.root.showEditUser", literal: false },
      { set: "scopes.root.editUserId", literal: "" },
      { set: "scopes.root.editUserName", literal: "" },
      { set: "scopes.root.editUserEmail", literal: "" },
      { set: "scopes.root.userSearchTerm", literal: "" },
      { set: "scopes.root.taskPage", literal: 1 },
      { set: "scopes.root.userPage", literal: 1 },
    ],
    children: [
      "heading",
      "stats-row",
      "charts-row",
      "tabs",
      "add-task-modal",
      "edit-task-modal",
      "add-user-modal",
      "edit-user-modal",
    ],
  },
  {
    key: "heading",
    component: "Heading",
    props: {
      literal: { level: "1", children: "Project Management Dashboard" },
    },
  },
  {
    key: "stats-row",
    component: "FlexRow",
    props: { literal: { gap: "4", wrap: true } },
    children: ["stat-users", "stat-tasks", "stat-progress", "stat-done"],
  },
  {
    key: "stat-users",
    component: "Stat",
    props: {
      expr: '({label: "Total Users", value: scopes.root.users.length})',
    },
  },
  {
    key: "stat-tasks",
    component: "Stat",
    props: {
      expr: '({label: "Total Tasks", value: scopes.root.tasks.length})',
    },
  },
  {
    key: "stat-progress",
    component: "Stat",
    props: {
      expr: '({label: "In Progress", value: scopes.root.tasks.filter(t => t.status === "IN_PROGRESS").length, trend: "up", trendValue: scopes.root.tasks.filter(t => t.status === "IN_PROGRESS").length + " active"})',
    },
  },
  {
    key: "stat-done",
    component: "Stat",
    props: {
      expr: '({label: "Completed", value: scopes.root.tasks.filter(t => t.status === "DONE").length, trend: "up", trendValue: scopes.root.tasks.filter(t => t.status === "DONE").length + " done"})',
    },
  },
  {
    key: "charts-row",
    component: "FlexRow",
    props: { literal: { gap: "4", equalWidth: true } },
    children: ["bar-chart-card", "pie-chart-card"],
  },
  {
    key: "bar-chart-card",
    component: "Card",
    props: { literal: { title: "Tasks by Status" } },
    children: ["bar-chart"],
  },
  {
    key: "bar-chart",
    component: "BarChart",
    props: {
      expr: '({data: [{status: "TODO", count: String(scopes.root.tasks.filter(t => t.status === "TODO").length)}, {status: "In Progress", count: String(scopes.root.tasks.filter(t => t.status === "IN_PROGRESS").length)}, {status: "In Review", count: String(scopes.root.tasks.filter(t => t.status === "IN_REVIEW").length)}, {status: "Done", count: String(scopes.root.tasks.filter(t => t.status === "DONE").length)}], xKey: "status", yKeys: ["count"], height: 300, colors: ["#6366f1", "#f59e0b", "#8b5cf6", "#22c55e"]})',
    },
  },
  {
    key: "pie-chart-card",
    component: "Card",
    props: { literal: { title: "Tasks per Team Member" } },
    children: ["pie-chart"],
  },
  {
    key: "pie-chart",
    component: "PieChart",
    props: {
      expr: "({data: scopes.root.users.map(u => ({name: u.fullName, value: scopes.root.tasks.filter(t => t.userId === u.id).length})), height: 300, donut: true, showLabels: true})",
    },
  },
  {
    key: "tabs",
    component: "Tabs",
    props: { expr: "({value: scopes.root.activeTab})" },
    callbacks: {
      onValueChange: [{ set: "scopes.root.activeTab", expr: "evt.value" }],
    },
    children: ["tab-list", "tab-content-tasks", "tab-content-team"],
  },
  {
    key: "tab-list",
    component: "TabList",
    children: ["tab-trigger-tasks", "tab-trigger-team"],
  },
  {
    key: "tab-trigger-tasks",
    component: "TabTrigger",
    props: { literal: { value: "tasks", children: "Tasks Board" } },
  },
  {
    key: "tab-trigger-team",
    component: "TabTrigger",
    props: { literal: { value: "team", children: "Team Management" } },
  },
  {
    key: "tab-content-tasks",
    component: "TabContent",
    props: { literal: { value: "tasks" } },
    children: ["tasks-toolbar", "tasks-table", "tasks-pagination-row"],
  },
  {
    key: "tasks-toolbar",
    component: "FlexRow",
    props: { literal: { gap: "4", justify: "between", align: "center" } },
    children: ["search-input", "add-task-btn"],
  },
  {
    key: "search-input",
    component: "Input",
    props: {
      expr: '({value: scopes.root.searchTerm, placeholder: "Search tasks by title...", kind: "search"})',
    },
    callbacks: {
      onChange: [
        { set: "scopes.root.searchTerm", expr: "evt.value" },
        {
          set: "scopes.root.filteredTasks",
          expr: 'scopes.root.tasks.filter(t => evt.value === "" || t.title.toLowerCase().includes(evt.value.toLowerCase()))',
        },
        { set: "scopes.root.taskPage", literal: 1 },
        {
          set: "scopes.root.paginatedTasks",
          expr: "scopes.root.filteredTasks.slice(0, 25)",
        },
      ],
    },
  },
  {
    key: "add-task-btn",
    component: "Button",
    props: { literal: { children: "+ Add Task" } },
    callbacks: { onClick: [{ set: "scopes.root.showAddTask", literal: true }] },
  },
  {
    key: "tasks-table",
    component: "Table",
    children: ["tasks-thead", "tasks-tbody"],
  },
  {
    key: "tasks-thead",
    component: "TableHeader",
    children: ["tasks-header-row"],
  },
  {
    key: "tasks-header-row",
    component: "TableRow",
    children: ["th-title", "th-desc", "th-status", "th-user", "th-actions"],
  },
  {
    key: "th-title",
    component: "TableHead",
    props: { literal: { children: "Title" } },
  },
  {
    key: "th-desc",
    component: "TableHead",
    props: { literal: { children: "Description" } },
  },
  {
    key: "th-status",
    component: "TableHead",
    props: { literal: { children: "Status" } },
  },
  {
    key: "th-user",
    component: "TableHead",
    props: { literal: { children: "Assigned To" } },
  },
  {
    key: "th-actions",
    component: "TableHead",
    props: { literal: { children: "Actions" } },
  },
  {
    key: "tasks-tbody",
    component: "TableBody",
    seed: [
      { set: "scopes.root.filteredTasks", expr: "scopes.root.tasks" },
      {
        set: "scopes.root.paginatedTasks",
        expr: "scopes.root.tasks.slice(0, 25)",
      },
    ],
    children: ["task-rows"],
  },
  {
    key: "task-rows",
    component: "TableRow",
    as: "taskRow",
    keyBy: "id",
    each: "scopes.root.paginatedTasks",
    children: ["td-title", "td-desc", "td-status", "td-user", "td-actions"],
  },
  {
    key: "td-title",
    component: "TableCell",
    children: ["title-text"],
  },
  {
    key: "title-text",
    component: "Text",
    props: { expr: "({children: scopes.taskRow.item.title})" },
  },
  {
    key: "td-desc",
    component: "TableCell",
    children: ["desc-text"],
  },
  {
    key: "desc-text",
    component: "Text",
    props: {
      expr: '({children: scopes.taskRow.item.description, variant: "muted"})',
    },
  },
  {
    key: "td-status",
    component: "TableCell",
    children: ["status-badge"],
  },
  {
    key: "status-badge",
    component: "Badge",
    props: {
      expr: '({children: scopes.taskRow.item.status === "IN_PROGRESS" ? "In Progress" : (scopes.taskRow.item.status === "IN_REVIEW" ? "In Review" : (scopes.taskRow.item.status === "DONE" ? "Done" : "To Do")), variant: scopes.taskRow.item.status === "DONE" ? "default" : (scopes.taskRow.item.status === "IN_PROGRESS" ? "secondary" : (scopes.taskRow.item.status === "IN_REVIEW" ? "outline" : "destructive"))})',
    },
  },
  {
    key: "td-user",
    component: "TableCell",
    children: ["user-name-text"],
  },
  {
    key: "user-name-text",
    component: "Text",
    props: {
      expr: '({children: scopes.root.users.find(u => u.id === scopes.taskRow.item.userId)?.fullName ?? "Unassigned"})',
    },
  },
  {
    key: "td-actions",
    component: "TableCell",
    children: ["task-dropdown"],
  },
  {
    key: "task-dropdown",
    component: "DropdownMenu",
    children: ["task-edit-item", "task-delete-item"],
  },
  {
    key: "task-edit-item",
    component: "DropdownMenuItem",
    props: { literal: { children: "Edit" } },
    callbacks: {
      onClick: [
        { set: "scopes.root.editTaskId", expr: "scopes.taskRow.item.id" },
        { set: "scopes.root.editTaskTitle", expr: "scopes.taskRow.item.title" },
        {
          set: "scopes.root.editTaskDesc",
          expr: "scopes.taskRow.item.description",
        },
        {
          set: "scopes.root.editTaskStatus",
          expr: 'scopes.taskRow.item.status != null ? scopes.taskRow.item.status : "TODO"',
        },
        {
          set: "scopes.root.editTaskUserId",
          expr: "scopes.taskRow.item.userId",
        },
        { set: "scopes.root.showEditTask", literal: true },
      ],
    },
  },
  {
    key: "task-delete-item",
    component: "DropdownMenuItem",
    props: { literal: { children: "Delete", variant: "destructive" } },
    callbacks: {
      onClick: [
        {
          set: "scopes.root._deleteTaskResult",
          expr: "TaskApi_deleteTask({params: {key: scopes.taskRow.item.id}})",
          confirm:
            "Are you sure you want to delete this task? This action cannot be undone.",
        },
        { set: "scopes.root.tasks", expr: "TaskApi_getTasks()" },
        {
          set: "scopes.root.filteredTasks",
          expr: 'scopes.root.tasks.filter(t => scopes.root.searchTerm === "" || t.title.toLowerCase().includes(scopes.root.searchTerm.toLowerCase()))',
        },
        {
          set: "scopes.root.paginatedTasks",
          expr: "scopes.root.filteredTasks.slice((scopes.root.taskPage - 1) * 25, scopes.root.taskPage * 25)",
        },
      ],
    },
  },
  {
    key: "tasks-pagination-row",
    component: "FlexRow",
    props: { literal: { justify: "center" } },
    hidden: "scopes.root.filteredTasks.length <= 25",
    children: ["tasks-pagination"],
  },
  {
    key: "tasks-pagination",
    component: "Pagination",
    props: {
      expr: "({currentPage: scopes.root.taskPage, totalPages: Math.ceil(scopes.root.filteredTasks.length / 25)})",
    },
    callbacks: {
      onPageChange: [
        { set: "scopes.root.taskPage", expr: "evt.page" },
        {
          set: "scopes.root.paginatedTasks",
          expr: "scopes.root.filteredTasks.slice((evt.page - 1) * 25, evt.page * 25)",
        },
      ],
    },
  },
  {
    key: "tab-content-team",
    component: "TabContent",
    props: { literal: { value: "team" } },
    children: ["team-toolbar", "users-table", "users-pagination-row"],
  },
  {
    key: "team-toolbar",
    component: "FlexRow",
    props: { literal: { gap: "4", justify: "between", align: "center" } },
    children: ["user-search-input", "add-user-btn"],
  },
  {
    key: "user-search-input",
    component: "Input",
    props: {
      expr: '({value: scopes.root.userSearchTerm, placeholder: "Search users by name...", kind: "search"})',
    },
    callbacks: {
      onChange: [
        { set: "scopes.root.userSearchTerm", expr: "evt.value" },
        {
          set: "scopes.root.filteredUsers",
          expr: 'scopes.root.users.filter(u => evt.value === "" || u.fullName.toLowerCase().includes(evt.value.toLowerCase()))',
        },
        { set: "scopes.root.userPage", literal: 1 },
        {
          set: "scopes.root.paginatedUsers",
          expr: "scopes.root.filteredUsers.slice(0, 25)",
        },
      ],
    },
  },
  {
    key: "add-user-btn",
    component: "Button",
    props: { literal: { children: "+ Add User" } },
    callbacks: { onClick: [{ set: "scopes.root.showAddUser", literal: true }] },
  },
  {
    key: "users-table",
    component: "Table",
    children: ["users-thead", "users-tbody"],
  },
  {
    key: "users-thead",
    component: "TableHeader",
    children: ["users-header-row"],
  },
  {
    key: "users-header-row",
    component: "TableRow",
    children: ["uth-name", "uth-email", "uth-tasks", "uth-actions"],
  },
  {
    key: "uth-name",
    component: "TableHead",
    props: { literal: { children: "Full Name" } },
  },
  {
    key: "uth-email",
    component: "TableHead",
    props: { literal: { children: "Email" } },
  },
  {
    key: "uth-tasks",
    component: "TableHead",
    props: { literal: { children: "Task Count" } },
  },
  {
    key: "uth-actions",
    component: "TableHead",
    props: { literal: { children: "Actions" } },
  },
  {
    key: "users-tbody",
    component: "TableBody",
    seed: [
      { set: "scopes.root.filteredUsers", expr: "scopes.root.users" },
      {
        set: "scopes.root.paginatedUsers",
        expr: "scopes.root.users.slice(0, 25)",
      },
    ],
    children: ["user-rows"],
  },
  {
    key: "user-rows",
    component: "TableRow",
    as: "userRow",
    keyBy: "id",
    each: "scopes.root.paginatedUsers",
    children: ["utd-name", "utd-email", "utd-task-count", "utd-actions"],
  },
  {
    key: "utd-name",
    component: "TableCell",
    children: ["uname-text"],
  },
  {
    key: "uname-text",
    component: "Text",
    props: { expr: "({children: scopes.userRow.item.fullName})" },
  },
  {
    key: "utd-email",
    component: "TableCell",
    children: ["uemail-text"],
  },
  {
    key: "uemail-text",
    component: "Text",
    props: {
      expr: '({children: scopes.userRow.item.email, variant: "muted"})',
    },
  },
  {
    key: "utd-task-count",
    component: "TableCell",
    children: ["task-count-badge"],
  },
  {
    key: "task-count-badge",
    component: "Badge",
    props: {
      expr: '({children: scopes.root.tasks.filter(t => t.userId === scopes.userRow.item.id).length, variant: "secondary"})',
    },
  },
  {
    key: "utd-actions",
    component: "TableCell",
    children: ["user-dropdown"],
  },
  {
    key: "user-dropdown",
    component: "DropdownMenu",
    children: ["user-edit-item", "user-delete-item"],
  },
  {
    key: "user-edit-item",
    component: "DropdownMenuItem",
    props: { literal: { children: "Edit" } },
    callbacks: {
      onClick: [
        { set: "scopes.root.editUserId", expr: "scopes.userRow.item.id" },
        {
          set: "scopes.root.editUserName",
          expr: "scopes.userRow.item.fullName",
        },
        { set: "scopes.root.editUserEmail", expr: "scopes.userRow.item.email" },
        { set: "scopes.root.showEditUser", literal: true },
      ],
    },
  },
  {
    key: "user-delete-item",
    component: "DropdownMenuItem",
    props: { literal: { children: "Delete", variant: "destructive" } },
    callbacks: {
      onClick: [
        {
          set: "scopes.root._deleteUserResult",
          expr: "UserApi_deleteUser({params: {key: scopes.userRow.item.id}})",
          confirm:
            "Are you sure you want to delete this user? All tasks assigned to this user will also be removed. This action cannot be undone.",
        },
        { set: "scopes.root.users", expr: "UserApi_getUsers()" },
        { set: "scopes.root.tasks", expr: "TaskApi_getTasks()" },
        {
          set: "scopes.root.filteredTasks",
          expr: 'scopes.root.tasks.filter(t => scopes.root.searchTerm === "" || t.title.toLowerCase().includes(scopes.root.searchTerm.toLowerCase()))',
        },
        {
          set: "scopes.root.paginatedTasks",
          expr: "scopes.root.filteredTasks.slice((scopes.root.taskPage - 1) * 25, scopes.root.taskPage * 25)",
        },
        {
          set: "scopes.root.filteredUsers",
          expr: 'scopes.root.users.filter(u => scopes.root.userSearchTerm === "" || u.fullName.toLowerCase().includes(scopes.root.userSearchTerm.toLowerCase()))',
        },
        {
          set: "scopes.root.paginatedUsers",
          expr: "scopes.root.filteredUsers.slice((scopes.root.userPage - 1) * 25, scopes.root.userPage * 25)",
        },
      ],
    },
  },
  {
    key: "users-pagination-row",
    component: "FlexRow",
    props: { literal: { justify: "center" } },
    hidden: "scopes.root.filteredUsers.length <= 25",
    children: ["users-pagination"],
  },
  {
    key: "users-pagination",
    component: "Pagination",
    props: {
      expr: "({currentPage: scopes.root.userPage, totalPages: Math.ceil(scopes.root.filteredUsers.length / 25)})",
    },
    callbacks: {
      onPageChange: [
        { set: "scopes.root.userPage", expr: "evt.page" },
        {
          set: "scopes.root.paginatedUsers",
          expr: "scopes.root.filteredUsers.slice((evt.page - 1) * 25, evt.page * 25)",
        },
      ],
    },
  },
  {
    key: "add-task-modal",
    component: "Modal",
    props: {
      expr: '({open: scopes.root.showAddTask, title: "Add New Task", description: "Fill in the details to create a new task."})',
    },
    callbacks: {
      onOpenChange: [{ set: "scopes.root.showAddTask", expr: "evt.open" }],
    },
    children: ["add-task-form"],
  },
  {
    key: "add-task-form",
    component: "FlexCol",
    props: { literal: { gap: "4" } },
    children: [
      "field-new-task-title",
      "field-new-task-desc",
      "field-new-task-status",
      "field-new-task-user",
      "submit-task-row",
    ],
  },
  {
    key: "field-new-task-title",
    component: "Field",
    children: ["lbl-new-task-title", "input-new-task-title"],
  },
  {
    key: "lbl-new-task-title",
    component: "FieldLabel",
    props: { literal: { children: "Title" } },
  },
  {
    key: "input-new-task-title",
    component: "Input",
    props: {
      expr: '({value: scopes.root.newTaskTitle, placeholder: "Enter task title"})',
    },
    callbacks: {
      onChange: [{ set: "scopes.root.newTaskTitle", expr: "evt.value" }],
    },
  },
  {
    key: "field-new-task-desc",
    component: "Field",
    children: ["lbl-new-task-desc", "input-new-task-desc"],
  },
  {
    key: "lbl-new-task-desc",
    component: "FieldLabel",
    props: { literal: { children: "Description" } },
  },
  {
    key: "input-new-task-desc",
    component: "Input",
    props: {
      expr: '({value: scopes.root.newTaskDesc, placeholder: "Enter task description"})',
    },
    callbacks: {
      onChange: [{ set: "scopes.root.newTaskDesc", expr: "evt.value" }],
    },
  },
  {
    key: "field-new-task-status",
    component: "Field",
    children: ["lbl-new-task-status", "select-new-task-status"],
  },
  {
    key: "lbl-new-task-status",
    component: "FieldLabel",
    props: { literal: { children: "Status" } },
  },
  {
    key: "select-new-task-status",
    component: "Select",
    props: {
      expr: '({value: scopes.root.newTaskStatus, placeholder: "Select status", options: [{label: "To Do", value: "TODO"}, {label: "In Progress", value: "IN_PROGRESS"}, {label: "In Review", value: "IN_REVIEW"}, {label: "Done", value: "DONE"}]})',
    },
    callbacks: {
      onChange: [{ set: "scopes.root.newTaskStatus", expr: "evt.value" }],
    },
  },
  {
    key: "field-new-task-user",
    component: "Field",
    children: ["lbl-new-task-user", "select-new-task-user"],
  },
  {
    key: "lbl-new-task-user",
    component: "FieldLabel",
    props: { literal: { children: "Assign To" } },
  },
  {
    key: "select-new-task-user",
    component: "Select",
    props: {
      expr: '({value: scopes.root.newTaskUserId, placeholder: "Select a user", options: scopes.root.users.map(u => ({label: u.fullName, value: u.id}))})',
    },
    callbacks: {
      onChange: [{ set: "scopes.root.newTaskUserId", expr: "evt.value" }],
    },
  },
  {
    key: "submit-task-row",
    component: "FlexRow",
    props: { literal: { gap: "2", justify: "end" } },
    children: ["cancel-add-task-btn", "submit-add-task-btn"],
  },
  {
    key: "cancel-add-task-btn",
    component: "Button",
    props: { literal: { children: "Cancel", variant: "outline" } },
    callbacks: {
      onClick: [{ set: "scopes.root.showAddTask", literal: false }],
    },
  },
  {
    key: "submit-add-task-btn",
    component: "Button",
    props: { literal: { children: "Create Task" } },
    callbacks: {
      onClick: [
        {
          set: "scopes.root._createTaskResult",
          expr: "TaskApi_createTask({body: {title: scopes.root.newTaskTitle, description: scopes.root.newTaskDesc, status: scopes.root.newTaskStatus, userId: scopes.root.newTaskUserId}})",
        },
        { set: "scopes.root.tasks", expr: "TaskApi_getTasks()" },
        {
          set: "scopes.root.filteredTasks",
          expr: 'scopes.root.tasks.filter(t => scopes.root.searchTerm === "" || t.title.toLowerCase().includes(scopes.root.searchTerm.toLowerCase()))',
        },
        {
          set: "scopes.root.paginatedTasks",
          expr: "scopes.root.filteredTasks.slice((scopes.root.taskPage - 1) * 25, scopes.root.taskPage * 25)",
        },
        { set: "scopes.root.showAddTask", literal: false },
        { set: "scopes.root.newTaskTitle", literal: "" },
        { set: "scopes.root.newTaskDesc", literal: "" },
        { set: "scopes.root.newTaskStatus", literal: "TODO" },
        { set: "scopes.root.newTaskUserId", literal: "" },
      ],
    },
  },
  {
    key: "edit-task-modal",
    component: "Modal",
    props: {
      expr: '({open: scopes.root.showEditTask, title: "Edit Task", description: "Update the task details."})',
    },
    callbacks: {
      onOpenChange: [{ set: "scopes.root.showEditTask", expr: "evt.open" }],
    },
    children: ["edit-task-form"],
  },
  {
    key: "edit-task-form",
    component: "FlexCol",
    props: { literal: { gap: "4" } },
    children: [
      "field-edit-task-title",
      "field-edit-task-desc",
      "field-edit-task-status",
      "field-edit-task-user",
      "submit-edit-task-row",
    ],
  },
  {
    key: "field-edit-task-title",
    component: "Field",
    children: ["lbl-edit-task-title", "input-edit-task-title"],
  },
  {
    key: "lbl-edit-task-title",
    component: "FieldLabel",
    props: { literal: { children: "Title" } },
  },
  {
    key: "input-edit-task-title",
    component: "Input",
    props: {
      expr: '({value: scopes.root.editTaskTitle, placeholder: "Enter task title"})',
    },
    callbacks: {
      onChange: [{ set: "scopes.root.editTaskTitle", expr: "evt.value" }],
    },
  },
  {
    key: "field-edit-task-desc",
    component: "Field",
    children: ["lbl-edit-task-desc", "input-edit-task-desc"],
  },
  {
    key: "lbl-edit-task-desc",
    component: "FieldLabel",
    props: { literal: { children: "Description" } },
  },
  {
    key: "input-edit-task-desc",
    component: "Input",
    props: {
      expr: '({value: scopes.root.editTaskDesc, placeholder: "Enter task description"})',
    },
    callbacks: {
      onChange: [{ set: "scopes.root.editTaskDesc", expr: "evt.value" }],
    },
  },
  {
    key: "field-edit-task-status",
    component: "Field",
    children: ["lbl-edit-task-status", "select-edit-task-status"],
  },
  {
    key: "lbl-edit-task-status",
    component: "FieldLabel",
    props: { literal: { children: "Status" } },
  },
  {
    key: "select-edit-task-status",
    component: "Select",
    props: {
      expr: '({value: scopes.root.editTaskStatus, placeholder: "Select status", options: [{label: "To Do", value: "TODO"}, {label: "In Progress", value: "IN_PROGRESS"}, {label: "In Review", value: "IN_REVIEW"}, {label: "Done", value: "DONE"}]})',
    },
    callbacks: {
      onChange: [{ set: "scopes.root.editTaskStatus", expr: "evt.value" }],
    },
  },
  {
    key: "field-edit-task-user",
    component: "Field",
    children: ["lbl-edit-task-user", "select-edit-task-user"],
  },
  {
    key: "lbl-edit-task-user",
    component: "FieldLabel",
    props: { literal: { children: "Assign To" } },
  },
  {
    key: "select-edit-task-user",
    component: "Select",
    props: {
      expr: '({value: scopes.root.editTaskUserId, placeholder: "Select a user", options: scopes.root.users.map(u => ({label: u.fullName, value: u.id}))})',
    },
    callbacks: {
      onChange: [{ set: "scopes.root.editTaskUserId", expr: "evt.value" }],
    },
  },
  {
    key: "submit-edit-task-row",
    component: "FlexRow",
    props: { literal: { gap: "2", justify: "end" } },
    children: ["cancel-edit-task-btn", "submit-edit-task-btn"],
  },
  {
    key: "cancel-edit-task-btn",
    component: "Button",
    props: { literal: { children: "Cancel", variant: "outline" } },
    callbacks: {
      onClick: [{ set: "scopes.root.showEditTask", literal: false }],
    },
  },
  {
    key: "submit-edit-task-btn",
    component: "Button",
    props: { literal: { children: "Save Changes" } },
    callbacks: {
      onClick: [
        {
          set: "scopes.root._updateTaskResult",
          expr: "TaskApi_updateTask({body: {title: scopes.root.editTaskTitle, description: scopes.root.editTaskDesc, status: scopes.root.editTaskStatus, userId: scopes.root.editTaskUserId}, params: {key: scopes.root.editTaskId}})",
        },
        { set: "scopes.root.tasks", expr: "TaskApi_getTasks()" },
        {
          set: "scopes.root.filteredTasks",
          expr: 'scopes.root.tasks.filter(t => scopes.root.searchTerm === "" || t.title.toLowerCase().includes(scopes.root.searchTerm.toLowerCase()))',
        },
        {
          set: "scopes.root.paginatedTasks",
          expr: "scopes.root.filteredTasks.slice((scopes.root.taskPage - 1) * 25, scopes.root.taskPage * 25)",
        },
        { set: "scopes.root.showEditTask", literal: false },
      ],
    },
  },
  {
    key: "add-user-modal",
    component: "Modal",
    props: {
      expr: '({open: scopes.root.showAddUser, title: "Add New User", description: "Enter the user details."})',
    },
    callbacks: {
      onOpenChange: [{ set: "scopes.root.showAddUser", expr: "evt.open" }],
    },
    children: ["add-user-form"],
  },
  {
    key: "add-user-form",
    component: "FlexCol",
    props: { literal: { gap: "4" } },
    children: [
      "field-new-user-name",
      "field-new-user-email",
      "submit-user-row",
    ],
  },
  {
    key: "field-new-user-name",
    component: "Field",
    children: ["lbl-new-user-name", "input-new-user-name"],
  },
  {
    key: "lbl-new-user-name",
    component: "FieldLabel",
    props: { literal: { children: "Full Name" } },
  },
  {
    key: "input-new-user-name",
    component: "Input",
    props: {
      expr: '({value: scopes.root.newUserName, placeholder: "Enter full name"})',
    },
    callbacks: {
      onChange: [{ set: "scopes.root.newUserName", expr: "evt.value" }],
    },
  },
  {
    key: "field-new-user-email",
    component: "Field",
    children: ["lbl-new-user-email", "input-new-user-email"],
  },
  {
    key: "lbl-new-user-email",
    component: "FieldLabel",
    props: { literal: { children: "Email" } },
  },
  {
    key: "input-new-user-email",
    component: "Input",
    props: {
      expr: '({value: scopes.root.newUserEmail, placeholder: "Enter email address", kind: "email"})',
    },
    callbacks: {
      onChange: [{ set: "scopes.root.newUserEmail", expr: "evt.value" }],
    },
  },
  {
    key: "submit-user-row",
    component: "FlexRow",
    props: { literal: { gap: "2", justify: "end" } },
    children: ["cancel-add-user-btn", "submit-add-user-btn"],
  },
  {
    key: "cancel-add-user-btn",
    component: "Button",
    props: { literal: { children: "Cancel", variant: "outline" } },
    callbacks: {
      onClick: [{ set: "scopes.root.showAddUser", literal: false }],
    },
  },
  {
    key: "submit-add-user-btn",
    component: "Button",
    props: { literal: { children: "Create User" } },
    callbacks: {
      onClick: [
        {
          set: "scopes.root._createUserResult",
          expr: "UserApi_createUser({body: {fullName: scopes.root.newUserName, email: scopes.root.newUserEmail}})",
        },
        { set: "scopes.root.users", expr: "UserApi_getUsers()" },
        {
          set: "scopes.root.filteredUsers",
          expr: 'scopes.root.users.filter(u => scopes.root.userSearchTerm === "" || u.fullName.toLowerCase().includes(scopes.root.userSearchTerm.toLowerCase()))',
        },
        {
          set: "scopes.root.paginatedUsers",
          expr: "scopes.root.filteredUsers.slice((scopes.root.userPage - 1) * 25, scopes.root.userPage * 25)",
        },
        { set: "scopes.root.showAddUser", literal: false },
        { set: "scopes.root.newUserName", literal: "" },
        { set: "scopes.root.newUserEmail", literal: "" },
      ],
    },
  },
  {
    key: "edit-user-modal",
    component: "Modal",
    props: {
      expr: '({open: scopes.root.showEditUser, title: "Edit User", description: "Update the user details."})',
    },
    callbacks: {
      onOpenChange: [{ set: "scopes.root.showEditUser", expr: "evt.open" }],
    },
    children: ["edit-user-form"],
  },
  {
    key: "edit-user-form",
    component: "FlexCol",
    props: { literal: { gap: "4" } },
    children: [
      "field-edit-user-name",
      "field-edit-user-email",
      "submit-edit-user-row",
    ],
  },
  {
    key: "field-edit-user-name",
    component: "Field",
    children: ["lbl-edit-user-name", "input-edit-user-name"],
  },
  {
    key: "lbl-edit-user-name",
    component: "FieldLabel",
    props: { literal: { children: "Full Name" } },
  },
  {
    key: "input-edit-user-name",
    component: "Input",
    props: {
      expr: '({value: scopes.root.editUserName, placeholder: "Enter full name"})',
    },
    callbacks: {
      onChange: [{ set: "scopes.root.editUserName", expr: "evt.value" }],
    },
  },
  {
    key: "field-edit-user-email",
    component: "Field",
    children: ["lbl-edit-user-email", "input-edit-user-email"],
  },
  {
    key: "lbl-edit-user-email",
    component: "FieldLabel",
    props: { literal: { children: "Email" } },
  },
  {
    key: "input-edit-user-email",
    component: "Input",
    props: {
      expr: '({value: scopes.root.editUserEmail, placeholder: "Enter email address", kind: "email"})',
    },
    callbacks: {
      onChange: [{ set: "scopes.root.editUserEmail", expr: "evt.value" }],
    },
  },
  {
    key: "submit-edit-user-row",
    component: "FlexRow",
    props: { literal: { gap: "2", justify: "end" } },
    children: ["cancel-edit-user-btn", "submit-edit-user-btn"],
  },
  {
    key: "cancel-edit-user-btn",
    component: "Button",
    props: { literal: { children: "Cancel", variant: "outline" } },
    callbacks: {
      onClick: [{ set: "scopes.root.showEditUser", literal: false }],
    },
  },
  {
    key: "submit-edit-user-btn",
    component: "Button",
    props: { literal: { children: "Save Changes" } },
    callbacks: {
      onClick: [
        {
          set: "scopes.root._updateUserResult",
          expr: "UserApi_updateUser({body: {fullName: scopes.root.editUserName, email: scopes.root.editUserEmail}, params: {key: scopes.root.editUserId}})",
        },
        { set: "scopes.root.users", expr: "UserApi_getUsers()" },
        {
          set: "scopes.root.filteredUsers",
          expr: 'scopes.root.users.filter(u => scopes.root.userSearchTerm === "" || u.fullName.toLowerCase().includes(scopes.root.userSearchTerm.toLowerCase()))',
        },
        {
          set: "scopes.root.paginatedUsers",
          expr: "scopes.root.filteredUsers.slice((scopes.root.userPage - 1) * 25, scopes.root.userPage * 25)",
        },
        { set: "scopes.root.showEditUser", literal: false },
      ],
    },
  },
];
