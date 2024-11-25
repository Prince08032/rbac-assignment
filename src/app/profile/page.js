'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { jwtUtils } from '@/lib/jwt';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function Profile() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    // Get user data from localStorage to ensure we have the latest data
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (userData) {
      setFormData({
        name: userData.name || '',
        email: userData.email || '',
      });
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Update user in database
      const { error: updateError } = await supabase
        .from('users')
        .update({
          name: formData.name,
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Get the current user data
      const userData = JSON.parse(localStorage.getItem('userData'));
      
      // Create updated user data
      const updatedUserData = {
        ...userData,
        name: formData.name,
      };

      // Update localStorage
      localStorage.setItem('userData', JSON.stringify(updatedUserData));

      // Generate new token with updated data
      const newToken = jwtUtils.generateToken(updatedUserData);

      // Update token in cookies
      jwtUtils.setTokenCookie(newToken);

      setMessage({
        type: 'success',
        text: 'Profile updated successfully!'
      });

      // Reload the page after 1 second to reflect changes in sidebar
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Profile update error:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Failed to update profile'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="p-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Profile Settings</h1>
        
        {message && (
          <div className={`p-4 rounded-md mb-6 ${
            message.type === 'success' 
              ? 'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200' 
              : 'bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-200'
          }`}>
            {message.text}
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:border-indigo-500 focus:ring-indigo-500"
                required
                minLength={2}
                maxLength={50}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                disabled
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 bg-gray-50 dark:bg-gray-600 dark:border-gray-600 dark:text-gray-300"
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Email cannot be changed
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : (
                'Save Changes'
              )}
            </button>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
} 