import { supabase } from './supabase';

const defaultRoles = [
  {
    name: 'admin',
    description: 'Full access to all features'
  },
  {
    name: 'manager',
    description: 'Can manage users and content'
  },
  {
    name: 'user',
    description: 'Basic access to features'
  }
];

const defaultPermissions = [
  {
    name: 'view_dashboard',
    description: 'Can view dashboard'
  },
  {
    name: 'manage_users',
    description: 'Can manage users'
  },
  {
    name: 'edit_settings',
    description: 'Can edit settings'
  },
  {
    name: 'view_reports',
    description: 'Can view reports'
  },
  {
    name: 'manage_roles',
    description: 'Can manage roles'
  },
  {
    name: 'manage_permissions',
    description: 'Can manage permissions'
  }
];

const defaultRolePermissions = {
  admin: ['view_dashboard', 'manage_users', 'edit_settings', 'view_reports', 'manage_roles', 'manage_permissions'],
  manager: ['view_dashboard', 'manage_users', 'edit_settings', 'view_reports'],
  user: ['view_dashboard', 'edit_settings']
};

export const initializeDefaultData = async () => {
  try {
    // Check if roles exist
    const { data: existingRoles } = await supabase
      .from('roles')
      .select('name');

    if (!existingRoles?.length) {
      // Insert default roles
      const { error: rolesError } = await supabase
        .from('roles')
        .insert(defaultRoles);

      if (rolesError) throw rolesError;
    }

    // Check if permissions exist
    const { data: existingPermissions } = await supabase
      .from('permissions')
      .select('name');

    if (!existingPermissions?.length) {
      // Insert default permissions
      const { error: permissionsError } = await supabase
        .from('permissions')
        .insert(defaultPermissions);

      if (permissionsError) throw permissionsError;
    }

    // If both roles and permissions were just inserted, set up role permissions
    if (!existingRoles?.length && !existingPermissions?.length) {
      // Get all roles and permissions
      const { data: roles } = await supabase.from('roles').select('id, name');
      const { data: permissions } = await supabase.from('permissions').select('id, name');

      // Create role_permissions mappings
      const rolePermissionsMappings = [];

      roles.forEach(role => {
        const permissionsForRole = defaultRolePermissions[role.name] || [];
        permissionsForRole.forEach(permissionName => {
          const permission = permissions.find(p => p.name === permissionName);
          if (permission) {
            rolePermissionsMappings.push({
              role_id: role.id,
              permission_id: permission.id
            });
          }
        });
      });

      // Insert role permissions
      if (rolePermissionsMappings.length > 0) {
        const { error: mappingError } = await supabase
          .from('role_permissions')
          .insert(rolePermissionsMappings);

        if (mappingError) throw mappingError;
      }
    }

    return true;
  } catch (error) {
    console.error('Error initializing default data:', error);
    return false;
  }
}; 