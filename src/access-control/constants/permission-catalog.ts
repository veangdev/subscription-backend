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
    key: 'users.view',
    label: 'View users',
    group: 'User Management',
    description: 'View user accounts and directory details.',
    sort_order: 10,
  },
  {
    key: 'users.create',
    label: 'Create users',
    group: 'User Management',
    description: 'Create new user accounts.',
    sort_order: 20,
  },
  {
    key: 'users.edit',
    label: 'Edit users',
    group: 'User Management',
    description: 'Update user account details and roles.',
    sort_order: 30,
  },
  {
    key: 'users.delete',
    label: 'Delete users',
    group: 'User Management',
    description: 'Delete user accounts.',
    sort_order: 40,
  },
  {
    key: 'users.export',
    label: 'Export users',
    group: 'User Management',
    description: 'Export user directory data.',
    sort_order: 50,
  },
  {
    key: 'users.status.manage',
    label: 'Manage user status',
    group: 'User Management',
    description: 'Activate or deactivate user accounts.',
    sort_order: 60,
  },
  {
    key: 'security.roles.view',
    label: 'View roles',
    group: 'Security',
    description: 'View role definitions and member counts.',
    sort_order: 70,
  },
  {
    key: 'security.roles.manage',
    label: 'Manage roles',
    group: 'Security',
    description: 'Create, update, and delete roles.',
    sort_order: 80,
  },
  {
    key: 'security.permissions.assign',
    label: 'Assign permissions',
    group: 'Security',
    description: 'Assign permission sets to roles.',
    sort_order: 90,
  },
  {
    key: 'security.audit.view',
    label: 'View audit log',
    group: 'Security',
    description: 'Review audit and change history.',
    sort_order: 100,
  },
  {
    key: 'orders.view',
    label: 'View orders',
    group: 'Orders & Documents',
    description: 'View order data and status.',
    sort_order: 110,
  },
  {
    key: 'orders.approve',
    label: 'Approve orders',
    group: 'Orders & Documents',
    description: 'Approve order processing workflows.',
    sort_order: 120,
  },
  {
    key: 'documents.upload',
    label: 'Upload documents',
    group: 'Orders & Documents',
    description: 'Upload order or account documents.',
    sort_order: 130,
  },
  {
    key: 'documents.delete',
    label: 'Delete documents',
    group: 'Orders & Documents',
    description: 'Delete uploaded documents.',
    sort_order: 140,
  },
  {
    key: 'settings.view',
    label: 'View settings',
    group: 'System Settings',
    description: 'View platform settings.',
    sort_order: 150,
  },
  {
    key: 'settings.edit',
    label: 'Edit settings',
    group: 'System Settings',
    description: 'Edit platform settings.',
    sort_order: 160,
  },
  {
    key: 'notifications.manage',
    label: 'Manage notifications',
    group: 'System Settings',
    description: 'Configure notifications and announcements.',
    sort_order: 170,
  },
  {
    key: 'security.policy.edit',
    label: 'Edit security policy',
    group: 'System Settings',
    description: 'Update security policy settings.',
    sort_order: 180,
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
      'users.view',
      'users.edit',
      'users.status.manage',
      'security.roles.view',
      'security.permissions.assign',
      'security.audit.view',
      'orders.view',
      'orders.approve',
      'documents.upload',
      'settings.view',
    ],
  },
  {
    name: 'User',
    description: 'Standard workspace access and self-service actions.',
    is_admin: false,
    is_system: true,
    permission_keys: ['orders.view', 'settings.view'],
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
