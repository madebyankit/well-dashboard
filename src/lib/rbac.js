/**
 * Role-based access control.
 *
 * Two things are governed here:
 *   1. PERMISSIONS  — what a role may *do* (see a page, manage users, assign
 *      tasks, export data).
 *   2. `fields`     — what a role may *see*. A user carries a list of entitled
 *      field names; ['*'] means every field. Readings are narrowed with
 *      scopeToFields() before any metric is computed, so a scoped user's KPIs,
 *      charts and grids all reflect only their own fields.
 *
 * This is a front-end demo, so the user directory lives in memory and is
 * persisted to localStorage. In a real deployment the same permission map would
 * be enforced again on the server — the client copy only drives the UI.
 */

export const ROLES = {
  ADMIN: 'admin',
  ANALYST: 'analyst',
  OPERATOR: 'operator',
  VIEWER: 'viewer',
};

export const ROLE_LABEL = {
  [ROLES.ADMIN]: 'Administrator',
  [ROLES.ANALYST]: 'Production Analyst',
  [ROLES.OPERATOR]: 'Field Operator',
  [ROLES.VIEWER]: 'Viewer',
};

export const ROLE_DESCRIPTION = {
  [ROLES.ADMIN]: 'Full access, including user management and role changes.',
  [ROLES.ANALYST]: 'Sees every field, sets targets and assigns tasks to operators.',
  [ROLES.OPERATOR]: 'Works the wells in their own field and closes assigned tasks.',
  [ROLES.VIEWER]: 'Read-only access to dashboards for their entitled fields.',
};

/** Every permission the application checks. */
export const PERMISSIONS = {
  VIEW_DASHBOARD: 'dashboard:view',
  VIEW_WELL_DETAIL: 'well:view',
  EXPORT_DATA: 'data:export',
  VIEW_USERS: 'users:view',
  MANAGE_USERS: 'users:manage',
  VIEW_TASKS: 'tasks:view',
  ASSIGN_TASKS: 'tasks:assign',
  COMPLETE_TASKS: 'tasks:complete',
  MANAGE_APPEARANCE: 'appearance:manage',
};

const P = PERMISSIONS;

/** The permission matrix — the single source of truth for RBAC. */
export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    P.VIEW_DASHBOARD, P.VIEW_WELL_DETAIL, P.EXPORT_DATA,
    P.VIEW_USERS, P.MANAGE_USERS,
    P.VIEW_TASKS, P.ASSIGN_TASKS, P.COMPLETE_TASKS,
    P.MANAGE_APPEARANCE,
  ],
  [ROLES.ANALYST]: [
    P.VIEW_DASHBOARD, P.VIEW_WELL_DETAIL, P.EXPORT_DATA,
    P.VIEW_USERS,
    P.VIEW_TASKS, P.ASSIGN_TASKS, P.COMPLETE_TASKS,
    P.MANAGE_APPEARANCE,
  ],
  [ROLES.OPERATOR]: [
    P.VIEW_DASHBOARD, P.VIEW_WELL_DETAIL,
    P.VIEW_TASKS, P.COMPLETE_TASKS,
    P.MANAGE_APPEARANCE,
  ],
  [ROLES.VIEWER]: [
    P.VIEW_DASHBOARD, P.VIEW_WELL_DETAIL,
    P.MANAGE_APPEARANCE,
  ],
};

/** Does this user's role grant the permission? */
export function can(user, permission) {
  if (!user) return false;
  return (ROLE_PERMISSIONS[user.role] ?? []).includes(permission);
}

/** Is this field inside the user's data entitlement? */
export function canSeeField(user, field) {
  if (!user) return false;
  return user.fields?.includes('*') || user.fields?.includes(field);
}

/**
 * Which navigation entries a role may reach. The sidebar renders from this and
 * each page re-checks its own permission, so hiding a link is never the only
 * thing standing between a role and a page.
 */
export const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: 'gauge', permission: P.VIEW_DASHBOARD },
  { href: '/wells', label: 'Wells', icon: 'droplets', permission: P.VIEW_WELL_DETAIL },
  { href: '/users', label: 'Users & Tasks', icon: 'users', permission: P.VIEW_TASKS },
  { href: '/settings', label: 'Settings', icon: 'settings', permission: P.MANAGE_APPEARANCE },
];

/**
 * Seed user directory. Every account shares the demo password below — it is
 * documented in the README so reviewers can exercise each role.
 */
export const DEMO_PASSWORD = 'demo1234';

export const SEED_USERS = [
  {
    id: 'u-001',
    name: 'Ava Whitfield',
    email: 'ava.admin@enfinite.demo',
    role: ROLES.ADMIN,
    fields: ['*'],
    title: 'Production Systems Lead',
    active: true,
    createdAt: '2026-01-14',
  },
  {
    id: 'u-002',
    name: 'Liam Osei',
    email: 'liam.analyst@enfinite.demo',
    role: ROLES.ANALYST,
    fields: ['*'],
    title: 'Senior Production Analyst',
    active: true,
    createdAt: '2026-02-02',
  },
  {
    id: 'u-003',
    name: 'Priya Raman',
    email: 'priya.operator@enfinite.demo',
    role: ROLES.OPERATOR,
    fields: ['North Ridge (ESP)'],
    title: 'Field Operator — North Ridge',
    active: true,
    createdAt: '2026-02-19',
  },
  {
    id: 'u-004',
    name: 'Tom Byrne',
    email: 'tom.operator@enfinite.demo',
    role: ROLES.OPERATOR,
    fields: ['Cedar Flats (Rod Pump)', 'Saltbush (Gas Lift)'],
    title: 'Field Operator — Cedar Flats',
    active: true,
    createdAt: '2026-03-08',
  },
  {
    id: 'u-005',
    name: 'Noor Haddad',
    email: 'noor.viewer@enfinite.demo',
    role: ROLES.VIEWER,
    fields: ['Blue Mesa (PCP)'],
    title: 'Partner Representative',
    active: true,
    createdAt: '2026-04-21',
  },
];

/** Seed tasks so the assignment feature has something to show on first load. */
export const SEED_TASKS = [
  {
    id: 't-001',
    title: 'Investigate sustained under-performance on CF-005',
    well: 'CF-005',
    assigneeId: 'u-004',
    createdById: 'u-002',
    priority: 'high',
    status: 'in-progress',
    dueDate: '2026-09-22',
    createdAt: '2026-09-10',
    notes: 'Attainment has sat below 75% for three weeks. Check rod string and fluid level.',
  },
  {
    id: 't-002',
    title: 'Verify sensor calibration after production spike on NR-007',
    well: 'NR-007',
    assigneeId: 'u-003',
    createdById: 'u-002',
    priority: 'medium',
    status: 'open',
    dueDate: '2026-09-19',
    createdAt: '2026-09-12',
    notes: 'Flagged as an outlier by anomaly detection — confirm the reading is real before revising target.',
  },
  {
    id: 't-003',
    title: 'Review Q3 targets for Saltbush wells',
    well: 'SB-003',
    assigneeId: 'u-002',
    createdById: 'u-001',
    priority: 'low',
    status: 'open',
    dueDate: '2026-09-30',
    createdAt: '2026-09-14',
    notes: 'Field is tracking ~6% below target; confirm whether the target or the lift design needs revisiting.',
  },
  {
    id: 't-004',
    title: 'Close out downtime report for BM-004',
    well: 'BM-004',
    assigneeId: 'u-004',
    createdById: 'u-001',
    priority: 'medium',
    status: 'done',
    dueDate: '2026-09-08',
    createdAt: '2026-09-01',
    notes: 'Four zero-production days recorded. Root cause logged as planned workover.',
  },
];

export const TASK_STATUSES = ['open', 'in-progress', 'done'];
export const TASK_PRIORITIES = ['low', 'medium', 'high'];
