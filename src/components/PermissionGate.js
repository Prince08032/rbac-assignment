'use client';
import { useAuth } from '@/contexts/AuthContext';
import { permissionUtils } from '@/lib/permissions';
import { useState, useEffect } from 'react';

export default function PermissionGate({ 
  children, 
  permissions,
  requireAll = false,
  fallback = null
}) {
  const { user, loading: authLoading } = useAuth();
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPermissions = async () => {
      // Wait for auth to be ready
      if (authLoading) return;

      if (!user) {
        setHasPermission(false);
        setLoading(false);
        return;
      }

      try {
        const result = requireAll 
          ? await permissionUtils.hasAllPermissions(user.role, permissions)
          : await permissionUtils.hasAnyPermission(user.role, permissions);
        
        setHasPermission(result);
      } catch (error) {
        console.error('Permission check error:', error);
        setHasPermission(false);
      } finally {
        setLoading(false);
      }
    };

    checkPermissions();
  }, [user, permissions, requireAll, authLoading]);

  // Show loading state while auth is initializing
  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return hasPermission ? children : fallback;
} 