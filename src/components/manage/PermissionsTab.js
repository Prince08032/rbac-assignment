'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import ErrorState from '@/components/ErrorState';
import { initializeDefaultData } from '@/lib/defaultData';

export default function PermissionsTab() {
  const [permissions, setPermissions] = useState([]);
  const [isAddingPermission, setIsAddingPermission] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newPermission, setNewPermission] = useState({ name: '', description: '' });

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      // Initialize default data if needed
      await initializeDefaultData();

      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (!data || data.length === 0) {
        setError({
          type: 'empty',
          message: 'No permissions found. Please create your first permission.'
        });
        setPermissions([]);
      } else {
        setPermissions(data);
        setError(null);
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
      setError({
        type: 'error',
        message: error.message || 'Failed to fetch permissions'
      });
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPermission = async () => {
    try {
      const { data, error } = await supabase
        .from('permissions')
        .insert([{
          name: newPermission.name,
          description: newPermission.description
        }])
        .select()
        .single();

      if (error) throw error;

      setPermissions([data, ...permissions]);
      setIsAddingPermission(false);
      setNewPermission({ name: '', description: '' });
    } catch (error) {
      console.error('Error adding permission:', error);
      setError(error.message);
    }
  };

  const handleDeletePermission = async (permissionId) => {
    try {
      const { error } = await supabase
        .from('permissions')
        .delete()
        .eq('id', permissionId);

      if (error) throw error;

      setPermissions(permissions.filter(p => p.id !== permissionId));
    } catch (error) {
      console.error('Error deleting permission:', error);
      setError(error.message);
    }
  };

  const handleUpdatePermission = async (permissionId, updates) => {
    try {
      const { data, error } = await supabase
        .from('permissions')
        .update(updates)
        .eq('id', permissionId)
        .select()
        .single();

      if (error) throw error;

      setPermissions(permissions.map(p => 
        p.id === permissionId ? data : p
      ));
    } catch (error) {
      console.error('Error updating permission:', error);
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
        <h3 className="text-lg font-semibold">Permissions List</h3>
        <button 
          onClick={() => setIsAddingPermission(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Add Permission
        </button>
      </div>

      {error && (
        <ErrorState
          title={error.type === 'empty' ? 'No Permissions Found' : 'Error'}
          message={error.message}
          type={error.type}
        />
      )}

      {isAddingPermission && (
        <div className="mb-6 p-4 border dark:border-gray-700 rounded-lg">
          <h4 className="text-lg font-medium mb-4">Add New Permission</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Permission Name</label>
              <input
                type="text"
                value={newPermission.name}
                onChange={(e) => setNewPermission({ ...newPermission, name: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="view_dashboard"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={newPermission.description}
                onChange={(e) => setNewPermission({ ...newPermission, description: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Describe what this permission allows"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setIsAddingPermission(false);
                  setNewPermission({ name: '', description: '' });
                }}
                className="px-4 py-2 border border-gray-300 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPermission}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md"
              >
                Save Permission
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {permissions.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-4">
            No permissions found. Add your first permission.
          </p>
        ) : (
          permissions.map((permission) => (
            <div key={permission.id} className="flex items-center justify-between p-4 border dark:border-gray-700 rounded-lg">
              <div>
                <h4 className="text-lg font-medium">{permission.name}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {permission.description}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Created: {new Date(permission.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    const newName = prompt('Enter new name:', permission.name);
                    const newDescription = prompt('Enter new description:', permission.description);
                    if (newName && newDescription) {
                      handleUpdatePermission(permission.id, {
                        name: newName,
                        description: newDescription
                      });
                    }
                  }}
                  className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400"
                >
                  Edit
                </button>
                <button 
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this permission?')) {
                      handleDeletePermission(permission.id);
                    }
                  }}
                  className="text-red-600 hover:text-red-900 dark:text-red-400"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 