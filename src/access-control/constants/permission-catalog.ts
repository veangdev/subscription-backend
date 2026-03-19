export interface PermissionSeed {
  key: string;
  label: string;
  group: string;
  description: string;
  sort_order: number;
}

export interface DefaultRoleSeed {
  name: string;
  description: string;
  is_admin: boolean;
  is_system: boolean;
  permission_keys: string[];
}

export const PERMISSION_CATALOG: PermissionSeed[] = [
  {
    key: 'dashboard.view',
    label: 'View dashboard',
    group: 'Dashboard',
    description: 'View the admin overview, metrics, and recent activity.',
    sort_order: 10,
  },
  {
    key: 'plans.view',
    label: 'View plans',
    group: 'Plans',
    description: 'View plan variants, cadence, pricing, and catalog details.',
    sort_order: 20,
  },
  {
    key: 'plans.create',
    label: 'Create plans',
    group: 'Plans',
    description: 'Create plan variants, seed defaults, and add products.',
    sort_order: 30,
  },
  {
    key: 'plans.edit',
    label: 'Edit plans',
    group: 'Plans',
    description: 'Update plan pricing, cadence, image, and included products.',
    sort_order: 40,
  },
  {
    key: 'plans.delete',
    label: 'Delete plans',
    group: 'Plans',
    description: 'Delete plan variants and product entries.',
    sort_order: 50,
  },
  {
    key: 'subscribers.view',
    label: 'View subscribers',
    group: 'Subscribers',
    description: 'View subscriber accounts and customer status.',
    sort_order: 60,
  },
  {
    key: 'subscribers.edit',
    label: 'Edit subscribers',
    group: 'Subscribers',
    description: 'Update subscriber profile and account fields.',
    sort_order: 70,
  },
  {
    key: 'subscribers.delete',
    label: 'Delete subscribers',
    group: 'Subscribers',
    description: 'Delete subscriber accounts.',
    sort_order: 80,
  },
  {
    key: 'subscribers.export',
    label: 'Export subscribers',
    group: 'Subscribers',
    description: 'Export subscriber directory data.',
    sort_order: 90,
  },
  {
    key: 'subscriptions.view',
    label: 'View subscriptions',
    group: 'Subscriptions',
    description: 'View subscription records and lifecycle status.',
    sort_order: 100,
  },
  {
    key: 'subscriptions.create',
    label: 'Create subscriptions',
    group: 'Subscriptions',
    description: 'Create new subscriptions for subscribers.',
    sort_order: 110,
  },
  {
    key: 'subscriptions.edit',
    label: 'Edit subscriptions',
    group: 'Subscriptions',
    description: 'Update subscription dates, plan, or lifecycle state.',
    sort_order: 120,
  },
  {
    key: 'subscriptions.delete',
    label: 'Delete subscriptions',
    group: 'Subscriptions',
    description: 'Delete subscription records.',
    sort_order: 130,
  },
  {
    key: 'shipments.view',
    label: 'View shipments',
    group: 'Shipments',
    description: 'View shipment queues, tracking, and fulfillment status.',
    sort_order: 140,
  },
  {
    key: 'shipments.create',
    label: 'Create shipments',
    group: 'Shipments',
    description: 'Create shipment records for subscriptions.',
    sort_order: 150,
  },
  {
    key: 'shipments.edit',
    label: 'Edit shipments',
    group: 'Shipments',
    description: 'Update shipment details, tracking, and status.',
    sort_order: 160,
  },
  {
    key: 'shipments.delete',
    label: 'Delete shipments',
    group: 'Shipments',
    description: 'Delete shipment records.',
    sort_order: 170,
  },
  {
    key: 'payments.view',
    label: 'View payments',
    group: 'Payments',
    description: 'View payment records and billing outcomes.',
    sort_order: 180,
  },
  {
    key: 'payments.create',
    label: 'Create payments',
    group: 'Payments',
    description: 'Create manual payment records.',
    sort_order: 190,
  },
  {
    key: 'payments.edit',
    label: 'Edit payments',
    group: 'Payments',
    description: 'Update payment amounts and statuses.',
    sort_order: 200,
  },
  {
    key: 'payments.delete',
    label: 'Delete payments',
    group: 'Payments',
    description: 'Delete payment records.',
    sort_order: 210,
  },
  {
    key: 'users.view',
    label: 'View users',
    group: 'Users',
    description: 'View admin users and assigned roles.',
    sort_order: 220,
  },
  {
    key: 'users.create',
    label: 'Create users',
    group: 'Users',
    description: 'Create new admin user accounts.',
    sort_order: 230,
  },
  {
    key: 'users.edit',
    label: 'Edit users',
    group: 'Users',
    description: 'Update admin user accounts and roles.',
    sort_order: 240,
  },
  {
    key: 'users.delete',
    label: 'Delete users',
    group: 'Users',
    description: 'Delete admin user accounts.',
    sort_order: 250,
  },
  {
    key: 'users.export',
    label: 'Export users',
    group: 'Users',
    description: 'Export admin user directory data.',
    sort_order: 260,
  },
  {
    key: 'security.roles.view',
    label: 'View roles',
    group: 'Security',
    description: 'View role definitions and member counts.',
    sort_order: 270,
  },
  {
    key: 'security.roles.manage',
    label: 'Manage roles',
    group: 'Security',
    description: 'Create, update, and delete roles.',
    sort_order: 280,
  },
  {
    key: 'security.permissions.assign',
    label: 'Assign permissions',
    group: 'Security',
    description: 'Assign permission sets to roles.',
    sort_order: 290,
  },
];

export const DEFAULT_ROLE_SEEDS: DefaultRoleSeed[] = [
  {
    name: 'Admin',
    description: 'Full platform administration and configuration.',
    is_admin: true,
    is_system: true,
    permission_keys: PERMISSION_CATALOG.map((permission) => permission.key),
  },
  {
    name: 'Moderator',
    description: 'User supervision, approvals, and content governance.',
    is_admin: true,
    is_system: true,
    permission_keys: [
      'dashboard.view',
      'plans.view',
      'subscribers.view',
      'subscriptions.view',
      'subscriptions.edit',
      'shipments.view',
      'shipments.edit',
      'payments.view',
      'users.view',
      'security.roles.view',
    ],
  },
  {
    name: 'User',
    description: 'Standard workspace access and self-service actions.',
    is_admin: false,
    is_system: true,
    permission_keys: [],
  },
  {
    name: 'Subscriber',
    description: 'Subscription customer account with no admin panel access.',
    is_admin: false,
    is_system: true,
    permission_keys: [],
  },
];

export const ALL_PERMISSION_KEYS = PERMISSION_CATALOG.map((permission) => permission.key);
