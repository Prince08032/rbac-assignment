'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { passwordUtils } from '@/lib/password';
import { useAuth } from '@/contexts/AuthContext';
import { permissionUtils } from '@/lib/permissions';

// Add User Modal Component
const AddUserModal = ({ isOpen, onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
    status: 'active'
  });
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role?.[0] === 'admin';

  // Fetch roles when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchRoles();
    }
  }, [isOpen]);

  const fetchRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('name');

      if (error) throw error;
      setRoles(data || []);
    } catch (error) {
      console.error('Error fetching roles:', error);
      setError('Failed to load roles');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Hash password
      const hashedPassword = await passwordUtils.hashPassword(formData.password);

      // Create new user
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([{
          ...formData,
          password: hashedPassword,
          role: [formData.role]
        }])
        .select()
        .single();

      if (createError) throw createError;

      onAdd(newUser);
      onClose();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Add New User</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              {roles.map(role => (
                <option 
                  key={role.id} 
                  value={role.name}
                  disabled={role.name === 'admin' && currentUser?.role?.[0] !== 'admin'}
                >
                  {role.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              disabled={!isAdmin}
              className="w-full rounded-md border border-gray-300 px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            {!isAdmin && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Only admins can set initial user status
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// View Details Modal Component
const ViewDetailsModal = ({ user, isOpen, onClose }) => {
  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">User Details</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {/* User Avatar */}
          <div className="flex justify-center">
            <div className="h-20 w-20 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-2xl">
              {user.name?.[0]?.toUpperCase() || '?'}
            </div>
          </div>

          {/* User Information */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Name</label>
              <p className="text-gray-900 dark:text-white">{user.name}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
              <p className="text-gray-900 dark:text-white">{user.email}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Role</label>
              <p className="text-gray-900 dark:text-white capitalize">{user.role?.[0] || 'user'}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                user.status === 'active' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                  : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
              }`}>
                {user.status}
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Created At</label>
              <p className="text-gray-900 dark:text-white">
                {new Date(user.created_at).toLocaleDateString()}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</label>
              <p className="text-gray-900 dark:text-white">
                {new Date(user.updated_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default function UsersTab({ users: initialUsers, currentUser, onStatusChange, onRoleChange }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState(initialUsers);
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(5);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('name');

      if (error) throw error;
      setRoles(data || []);
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  // Filter and sort users when search term or sort config changes
  useEffect(() => {
    let result = [...initialUsers];
    
    // Apply search filter
    if (searchTerm) {
      result = result.filter(user => 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role?.[0]?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        let aValue = sortConfig.key === 'role' ? a[sortConfig.key]?.[0] : a[sortConfig.key];
        let bValue = sortConfig.key === 'role' ? b[sortConfig.key]?.[0] : b[sortConfig.key];
        
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    setFilteredUsers(result);
    setCurrentPage(1); // Reset to first page when filtering
  }, [searchTerm, sortConfig, initialUsers]);

  // Get current users for pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Sort handler
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Generate page numbers
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  const handleAddUser = (newUser) => {
    setFilteredUsers([newUser, ...filteredUsers]);
  };

  // Update the canModifyUser function
  const canModifyUser = (currentUserRole, targetUser, action = 'any') => {
    // Get the current user's role
    const currentRole = Array.isArray(currentUserRole) 
      ? currentUserRole[0] 
      : currentUserRole;

    // Get the target user's role
    const targetRole = Array.isArray(targetUser.role) 
      ? targetUser.role[0] 
      : targetUser.role;

    // Can't modify own account
    if (targetUser.id === currentUser?.id) return false;

    // If target user is admin
    if (targetRole === 'admin') {
      // Only admin can modify another admin
      return currentRole === 'admin';
    }

    // For role changes
    if (action === 'role') {
      // Only admin can change roles
      return currentRole === 'admin';
    }

    // For status changes
    if (action === 'status') {
      // Admin can change anyone's status
      if (currentRole === 'admin') return true;
      
      // Users with manage_users permission can change non-admin users' status
      if (targetRole !== 'admin') {
        return permissionUtils.hasPermission(currentRole, 'manage_users');
      }
      
      return false;
    }

    return false;
  };

  return (
    <div className="p-4">
      {/* Search and Add User - Already responsive */}
      <div className="mb-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:w-64 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Add User
        </button>
      </div>

      {/* Responsive Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <div className="min-w-full align-middle">
            {/* Mobile View */}
            <div className="block sm:hidden">
              {currentUsers.map((user) => (
                <div 
                  key={user.id} 
                  className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4"
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
                      {user.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {user.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {user.email}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">
                        Role
                      </label>
                      <select
                        value={user.role?.[0] || 'user'}
                        onChange={(e) => {
                          // Check if can modify to admin role
                          if (e.target.value === 'admin' && currentUser?.role?.[0] !== 'admin') {
                            return; // Don't allow non-admins to set admin role
                          }
                          onRoleChange(user.id, e.target.value);
                        }}
                        disabled={!canModifyUser(currentUser?.role, user, 'role')}
                        className={`w-full text-sm rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 ${
                          user.role?.[0] === 'admin' ? 'text-red-600 font-semibold' : ''
                        }`}
                      >
                        {roles.map(role => (
                          <option 
                            key={role.id} 
                            value={role.name}
                            disabled={role.name === 'admin' && currentUser?.role?.[0] !== 'admin'}
                          >
                            {role.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">
                        Status
                      </label>
                      <select
                        value={user.status}
                        onChange={(e) => onStatusChange(user.id, e.target.value)}
                        disabled={!canModifyUser(currentUser?.role, user, 'status')}
                        className="w-full text-sm rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>

                    <div className="pt-2">
                      {user.id === currentUser?.id ? (
                        <span className="text-sm text-gray-400">(Current User)</span>
                      ) : (
                        <button 
                          onClick={() => {
                            setSelectedUser(user);
                            setIsViewModalOpen(true);
                          }}
                          className="text-sm text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >
                          View Details
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View */}
            <table className="hidden sm:table min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer whitespace-nowrap group"
                    onClick={() => requestSort('name')}
                  >
                    <div className="flex items-center gap-1">
                      User
                      <span className="text-gray-400 dark:text-gray-500">
                        {sortConfig.key === 'name' 
                          ? (sortConfig.direction === 'asc' ? '↑' : '↓')
                          : '↕'}
                      </span>
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer whitespace-nowrap group"
                    onClick={() => requestSort('role')}
                  >
                    <div className="flex items-center gap-1">
                      Role
                      <span className="text-gray-400 dark:text-gray-500">
                        {sortConfig.key === 'role' 
                          ? (sortConfig.direction === 'asc' ? '↑' : '↓')
                          : '↕'}
                      </span>
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer whitespace-nowrap group"
                    onClick={() => requestSort('status')}
                  >
                    <div className="flex items-center gap-1">
                      Status
                      <span className="text-gray-400 dark:text-gray-500">
                        {sortConfig.key === 'status' 
                          ? (sortConfig.direction === 'asc' ? '↑' : '↓')
                          : '↕'}
                      </span>
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {currentUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10">
                          <div className="h-full w-full rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm sm:text-base">
                            {user.name?.[0]?.toUpperCase() || '?'}
                          </div>
                        </div>
                        <div className="ml-3 sm:ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.name}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate max-w-[150px] sm:max-w-none">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <select
                        value={user.role?.[0] || 'user'}
                        onChange={(e) => {
                          // Check if can modify to admin role
                          if (e.target.value === 'admin' && currentUser?.role?.[0] !== 'admin') {
                            return; // Don't allow non-admins to set admin role
                          }
                          onRoleChange(user.id, e.target.value);
                        }}
                        disabled={!canModifyUser(currentUser?.role, user, 'role')}
                        className={`text-sm rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 w-full sm:w-auto ${
                          user.role?.[0] === 'admin' ? 'text-red-600 font-semibold' : ''
                        }`}
                      >
                        {roles.map(role => (
                          <option 
                            key={role.id} 
                            value={role.name}
                            disabled={role.name === 'admin' && currentUser?.role?.[0] !== 'admin'}
                          >
                            {role.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <select
                        value={user.status}
                        onChange={(e) => onStatusChange(user.id, e.target.value)}
                        disabled={!canModifyUser(currentUser?.role, user, 'status')}
                        className="text-sm rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 w-full sm:w-auto"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {user.id === currentUser?.id ? (
                        <span className="text-gray-400">(Current User)</span>
                      ) : (
                        <button 
                          onClick={() => {
                            setSelectedUser(user);
                            setIsViewModalOpen(true);
                          }}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >
                          View Details
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Responsive Pagination */}
      <div className="mt-4 flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-gray-700 dark:text-gray-300 text-center sm:text-left">
          Showing {indexOfFirstUser + 1} to {Math.min(indexOfLastUser, filteredUsers.length)} of {filteredUsers.length} users
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded-md bg-gray-100 dark:bg-gray-700 disabled:opacity-50 text-sm"
          >
            Previous
          </button>
          <div className="flex gap-1">
            {pageNumbers.map(number => (
              <button
                key={number}
                onClick={() => paginate(number)}
                className={`px-3 py-1 rounded-md text-sm ${
                  currentPage === number
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700'
                }`}
              >
                {number}
              </button>
            ))}
          </div>
          <button
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded-md bg-gray-100 dark:bg-gray-700 disabled:opacity-50 text-sm"
          >
            Next
          </button>
        </div>
      </div>

      {/* Modals remain the same */}
      <AddUserModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddUser}
      />

      <ViewDetailsModal
        user={selectedUser}
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedUser(null);
        }}
      />
    </div>
  );
} 