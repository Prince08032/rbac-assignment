'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { jwtUtils } from '@/lib/jwt';
import { useRouter, usePathname } from 'next/navigation';
import { permissionUtils } from '@/lib/permissions';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState([]);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    checkAuth();
  }, [pathname]);

  const checkAuth = async () => {
    try {
      setLoading(true);
      // Check for token in cookies
      const cookies = document.cookie.split(';');
      const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('token='));
      const token = tokenCookie ? tokenCookie.split('=')[1] : null;

      if (token) {
        // Verify token and set user data
        const userData = jwtUtils.verifyToken(token);
        if (userData) {
          // Get fresh user data from localStorage
          const storedUserData = localStorage.getItem('userData');
          if (storedUserData) {
            const parsedUserData = JSON.parse(storedUserData);
            setUser(parsedUserData);

            // Fetch user permissions
            const userPermissions = await permissionUtils.getRolePermissions(parsedUserData.role[0]);
            setPermissions(userPermissions);

            // Check if user has permission to access dashboard
            if (pathname === '/') {
              if (userPermissions.includes('view_dashboard')) {
                router.push('/dashboard');
              } else {
                handleLogout();
              }
            }
          }
        } else {
          // Token is invalid, clear it and redirect to auth
          handleLogout();
        }
      } else {
        // No token, redirect to auth if not already there
        if (pathname !== '/auth') {
          router.push('/auth');
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
      handleLogout();
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      jwtUtils.removeTokenCookie();
      localStorage.removeItem('userData');
      setUser(null);
      setPermissions([]);
      router.push('/auth');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Provide a function to update user data
  const updateUserData = async (newData) => {
    setUser(newData);
    localStorage.setItem('userData', JSON.stringify(newData));
    
    // Update permissions when user data changes
    const userPermissions = await permissionUtils.getRolePermissions(newData.role[0]);
    setPermissions(userPermissions);
  };

  // Function to check if user has permission
  const hasPermission = (permission) => {
    return permissions.includes(permission);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      logout: handleLogout, 
      updateUserData,
      permissions,
      hasPermission
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 