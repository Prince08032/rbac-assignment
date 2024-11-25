'use client';
import { useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { passwordUtils } from '@/lib/password';
import { jwtUtils } from '@/lib/jwt';

export default function Auth() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        // Login Process
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('email', formData.email.toLowerCase())
          .single();

        if (userError || !userData) {
          setError({
            type: 'error',
            message: 'Invalid email or password'
          });
          return;
        }

        // Check user status
        if (userData.status !== 'active') {
          setError({
            type: 'error',
            message: 'Your account is inactive. Please contact support.'
          });
          return;
        }

        // Verify password
        const isValidPassword = await passwordUtils.comparePassword(
          formData.password,
          userData.password
        );

        if (!isValidPassword) {
          setError({
            type: 'error',
            message: 'Invalid email or password'
          });
          return;
        }

        // Generate JWT token with user data
        const token = jwtUtils.generateToken({
          id: userData.id,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          status: userData.status
        });

        // Set token in cookie
        jwtUtils.setTokenCookie(token);

        // Store user data in local storage
        localStorage.setItem('userData', JSON.stringify({
          id: userData.id,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          status: userData.status
        }));

        // Show success message
        setError({
          type: 'success',
          message: 'Login successful! Redirecting...'
        });

        // Redirect to dashboard
        router.push('/dashboard');

      } else {
        // Signup Process
        // Check if email exists
        const { data: existingUser } = await supabase
          .from('users')
          .select('email')
          .eq('email', formData.email.toLowerCase())
          .single();

        if (existingUser) {
          setError({
            type: 'error',
            message: 'Email already registered'
          });
          return;
        }

        // Hash password
        const hashedPassword = await passwordUtils.hashPassword(formData.password);

        // Create new user
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert([
            {
              email: formData.email.toLowerCase(),
              name: formData.name,
              password: hashedPassword,
              role: ['user'],
              status: 'active'
            }
          ])
          .select()
          .single();

        if (createError) {
          console.error('User creation error:', createError);
          setError({
            type: 'error',
            message: 'Failed to create account. Please try again.'
          });
          return;
        }

        // Generate JWT token
        const token = jwtUtils.generateToken({
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          status: newUser.status
        });

        // Set token in cookie
        jwtUtils.setTokenCookie(token);

        // Store user data in local storage
        localStorage.setItem('userData', JSON.stringify({
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          status: newUser.status
        }));

        // Redirect to dashboard
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Auth error:', error);
      setError({
        type: 'error',
        message: 'An unexpected error occurred. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Password validation
  const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return (
      password.length >= minLength &&
      hasUpperCase &&
      hasLowerCase &&
      hasNumbers &&
      hasSpecialChar
    );
  };

  const handlePasswordChange = (e) => {
    const password = e.target.value;
    handleChange(e);

    if (!isLogin && password && !validatePassword(password)) {
      setError({
        type: 'error',
        message: 'Password must be at least 8 characters long and contain uppercase, lowercase, numbers, and special characters.'
      });
    } else {
      setError(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full space-y-8 p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
            {isLogin ? 'Sign in to your account' : 'Create new account'}
          </h2>
        </div>

        {error && (
          <div className={`p-3 rounded-md ${
            error.type === 'success' 
              ? 'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-100' 
              : 'bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-100'
          }`}>
            {error.message}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {!isLogin && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required={!isLogin}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
                minLength={2}
                maxLength={50}
              />
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="example@email.com"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="••••••••"
              value={formData.password}
              onChange={handlePasswordChange}
              minLength={8}
            />
            {!isLogin && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Password must be at least 8 characters long and contain uppercase, lowercase, numbers, and special characters.
              </p>
            )}
          </div>
          <div>
            <button
              type="submit"
              disabled={loading || (!isLogin && !validatePassword(formData.password))}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                isLogin ? 'Sign in' : 'Sign up'
              )}
            </button>
          </div>
        </form>
        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
              setFormData({ email: '', password: '', name: '' });
            }}
            className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
          >
            {isLogin ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
} 