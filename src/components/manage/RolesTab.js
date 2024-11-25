'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { FiTrash2 } from 'react-icons/fi';
import ErrorState from '@/components/ErrorState';
import { initializeDefaultData } from '@/lib/defaultData';

export default function RolesTab() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [isAddingRole, setIsAddingRole] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
    selectedPermissions: []
  });

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  const fetchRoles = async () => {
    try {
      await initializeDefaultData();

      const { data, error } = await supabase
        .from('roles')
        .select(`
          *,
          role_permissions (
            permissions (
              id,
              name,
              description
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (!data || data.length === 0) {
        setError({
          type: 'empty',
          message: 'No roles found. Please create your first role.'
        });
        setRoles([]);
      } else {
        setRoles(data);
        setError(null);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      setError({
        type: 'error',
        message: error.message || 'Failed to fetch roles'
      });
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .order('name');

      if (error) throw error;
      setPermissions(data);
    } catch (error) {
      console.error('Error fetching permissions:', error);
    }
  };

  const handleAddRole = async () => {
    try {
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .insert([{
          name: newRole.name,
          description: newRole.description
        }])
        .select()
        .single();

      if (roleError) throw roleError;

      if (newRole.selectedPermissions.length > 0) {
        const rolePermissions = newRole.selectedPermissions.map(permissionId => ({
          role_id: roleData.id,
          permission_id: permissionId
        }));

        const { error: permError } = await supabase
          .from('role_permissions')
          .insert(rolePermissions);

        if (permError) throw permError;
      }

      await fetchRoles();
      
      setIsAddingRole(false);
      setNewRole({ name: '', description: '', selectedPermissions: [] });
    } catch (error) {
      console.error('Error adding role:', error);
      setError(error.message);
    }
  };

  const handleDeleteRole = async (roleId, roleName) => {
    // Don't allow deletion of default roles
    if (['admin', 'user', 'manager'].includes(roleName.toLowerCase())) {
      setError('Cannot delete default roles');
      return;
    }

    try {
      // Show confirmation dialog
      const confirmed = window.confirm(`Are you sure you want to delete the role "${roleName}"? This action cannot be undone.`);
      
      if (!confirmed) return;

      // Delete role (role_permissions will be automatically deleted due to CASCADE)
      const { error } = await supabase
        .from('roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;

      // Update local state
      setRoles(roles.filter(role => role.id !== roleId));
      setError(null);
    } catch (error) {
      console.error('Error deleting role:', error);
      setError(error.message);
    }
  };

  const handleUpdatePermissions = async (roleId, permissionId, isChecked) => {
    try {
      if (isChecked) {
        const { error: insertError } = await supabase
          .from('role_permissions')
          .insert([{ role_id: roleId, permission_id: permissionId }]);

        if (insertError) throw insertError;

        setRoles(roles.map(role => {
          if (role.id === roleId) {
            const updatedPermissions = [...(role.role_permissions || []), {
              permissions: permissions.find(p => p.id === permissionId)
            }];
            return { ...role, role_permissions: updatedPermissions };
          }
          return role;
        }));

        await fetchRoles();
      } else {
        const { error: deleteError } = await supabase
          .from('role_permissions')
          .delete()
          .eq('role_id', roleId)
          .eq('permission_id', permissionId);

        if (deleteError) throw deleteError;

        setRoles(roles.map(role => {
          if (role.id === roleId) {
            const updatedPermissions = role.role_permissions.filter(
              rp => rp.permissions.id !== permissionId
            );
            return { ...role, role_permissions: updatedPermissions };
          }
          return role;
        }));

        await fetchRoles();
      }
    } catch (error) {
      console.error('Error updating permissions:', error);
      setError(error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Available Roles</h3>
        <button 
          onClick={() => setIsAddingRole(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Add New Role
        </button>
      </div>

      {error && (
        <ErrorState
          title={error.type === 'empty' ? 'No Roles Found' : 'Error'}
          message={error.message}
          type={error.type}
        />
      )}

      {isAddingRole && (
        <div className="mb-6 p-4 border dark:border-gray-700 rounded-lg">
          <h4 className="text-lg font-medium mb-4">Add New Role</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Role Name</label>
              <input
                type="text"
                value={newRole.name}
                onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={newRole.description}
                onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Permissions</label>
              <div className="space-y-2 max-h-48 overflow-y-auto p-2 border rounded-md dark:border-gray-600">
                {permissions.map((permission) => (
                  <label key={permission.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={newRole.selectedPermissions.includes(permission.id)}
                      onChange={(e) => {
                        const updatedPermissions = e.target.checked
                          ? [...newRole.selectedPermissions, permission.id]
                          : newRole.selectedPermissions.filter(id => id !== permission.id);
                        setNewRole({ ...newRole, selectedPermissions: updatedPermissions });
                      }}
                      className="rounded border-gray-300 dark:border-gray-600"
                    />
                    <span className="text-sm">
                      {permission.name}
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                        ({permission.description})
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setIsAddingRole(false);
                  setNewRole({ name: '', description: '', selectedPermissions: [] });
                }}
                className="px-4 py-2 border border-gray-300 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleAddRole}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md"
                disabled={!newRole.name.trim()}
              >
                Save Role
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {roles.map((role) => (
          <div key={role.id} className="border dark:border-gray-700 rounded-lg p-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-lg font-medium capitalize">{role.name}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {role.description}
                </p>
              </div>
              {!['admin', 'user', 'manager'].includes(role.name.toLowerCase()) && (
                <button
                  onClick={() => handleDeleteRole(role.id, role.name)}
                  className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                  title="Delete Role"
                >
                  <FiTrash2 className="w-5 h-5" />
                </button>
              )}
            </div>
            
            <div>
              <h5 className="text-sm font-medium mb-2">Permissions</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {permissions.map((permission) => {
                  const hasPermission = role.role_permissions?.some(
                    rp => rp.permissions.id === permission.id
                  );
                  
                  return (
                    <label key={permission.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={hasPermission}
                        onChange={(e) => handleUpdatePermissions(role.id, permission.id, e.target.checked)}
                        className="rounded border-gray-300 dark:border-gray-600"
                      />
                      <span className="text-sm">{permission.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 