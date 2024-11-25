'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useSearchParams, useRouter } from 'next/navigation';
import UsersTab from '@/components/manage/UsersTab';
import RolesTab from '@/components/manage/RolesTab';
import PermissionsTab from '@/components/manage/PermissionsTab';
import { permissionUtils } from '@/lib/permissions';
import ErrorState from '@/components/ErrorState';

// Access Denied Component
function AccessDenied() {
  return (
    <div className="p-8 text-center">
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
        Access Denied
      </h3>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        You don't have permission to access this feature.
      </p>
    </div>
  );
}

export default function ManageUsers() {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user: currentUser } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [availableTabs, setAvailableTabs] = useState([]);

  // Define tabs configuration
  const tabs = [
    { 
      id: 'users', 
      label: 'Users', 
      permission: ['manage_users', 'view_users']
    },
    { 
      id: 'roles', 
      label: 'Roles', 
      permission: ['manage_roles', 'view_roles']
    },
    { 
      id: 'permissions', 
      label: 'Permissions', 
      permission: ['manage_permissions', 'view_permissions']
    }
  ];

  // Initialize tabs and check permissions
  useEffect(() => {
    const initializeTabs = async () => {
      if (!currentUser) return;

      try {
        const userPermissions = await permissionUtils.getRolePermissions(currentUser.role[0]);
        const availableTabs = tabs.filter(tab => 
          tab.permission.some(perm => userPermissions.includes(perm))
        );

        setAvailableTabs(availableTabs);

        // Set initial tab from URL or first available tab
        const urlTab = searchParams.get('tab');
        if (urlTab && availableTabs.find(t => t.id === urlTab)) {
          setActiveTab(urlTab);
        } else if (availableTabs.length > 0) {
          setActiveTab(availableTabs[0].id);
        }

        // Only fetch users if users tab is active
        if (activeTab === 'users') {
          await fetchUsers();
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error initializing tabs:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    initializeTabs();
  }, [currentUser]);

  // Fetch users only when users tab is active
  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (!data || data.length === 0) {
        setError({
          type: 'empty',
          message: 'No users found in the system.'
        });
        setUsers([]);
      } else {
        setUsers(data);
        setError(null);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError({
        type: 'error',
        message: error.message || 'Failed to fetch users'
      });
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (userId, newStatus) => {
    try {
      const { data: targetUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (!targetUser) {
        setError('User not found');
        return;
      }

      const { error } = await supabase
        .from('users')
        .update({ status: newStatus })
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.map(user => 
        user.id === userId ? { ...user, status: newStatus } : user
      ));
    } catch (error) {
      console.error('Error updating user status:', error);
      setError(error.message);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: [newRole] })
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: [newRole] } : user
      ));
    } catch (error) {
      console.error('Error updating user role:', error);
      setError(error.message);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    router.push(`/manage-users?tab=${tab}`);
  };

  if (loading && !availableTabs.length) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!availableTabs.length) {
    return (
      <ProtectedRoute>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Manage Users</h1>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <AccessDenied />
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Manage Users</h1>
        </div>

        {error && (
          <ErrorState
            title={error.type === 'empty' ? 'No Data Found' : 'Error'}
            message={error.message}
            type={error.type}
          />
        )}

        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {availableTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          {activeTab === 'users' && (
            <UsersTab
              users={users}
              currentUser={currentUser}
              onStatusChange={handleStatusChange}
              onRoleChange={handleRoleChange}
            />
          )}
          {activeTab === 'roles' && <RolesTab />}
          {activeTab === 'permissions' && <PermissionsTab />}
        </div>
      </div>
    </ProtectedRoute>
  );
} 