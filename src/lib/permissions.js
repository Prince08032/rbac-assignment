import { supabase } from './supabase';

export const permissionUtils = {
  // Fetch role permissions from database
  async getRolePermissions(roleName) {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select(`
          name,
          role_permissions (
            permissions (
              name
            )
          )
        `)
        .eq('name', roleName)
        .single();

      if (error) throw error;

      // Extract permission names from the nested structure
      return data.role_permissions.map(rp => rp.permissions.name);
    } catch (error) {
      console.error('Error fetching role permissions:', error);
      return [];
    }
  },

  // Check if user has permission
  async hasPermission(userRole, permission) {
    if (!userRole) return false;
    const role = Array.isArray(userRole) ? userRole[0] : userRole;
    
    const permissions = await this.getRolePermissions(role);
    return permissions.includes(permission);
  },

  // Check if user has any of the required permissions
  async hasAnyPermission(userRole, permissions) {
    if (!userRole || !permissions) return false;
    const rolePermissions = await this.getRolePermissions(
      Array.isArray(userRole) ? userRole[0] : userRole
    );
    return permissions.some(permission => rolePermissions.includes(permission));
  },

  // Check if user has all of the required permissions
  async hasAllPermissions(userRole, permissions) {
    if (!userRole || !permissions) return false;
    const rolePermissions = await this.getRolePermissions(
      Array.isArray(userRole) ? userRole[0] : userRole
    );
    return permissions.every(permission => rolePermissions.includes(permission));
  }
}; 