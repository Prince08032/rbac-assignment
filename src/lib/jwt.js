import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXT_PUBLIC_JWT_SECRET || 'your-secret-key';

export const jwtUtils = {
  // Generate token
  generateToken(userData) {
    try {
      // Create a simple token structure
      const token = btoa(JSON.stringify({
        ...userData,
        exp: new Date().getTime() + (24 * 60 * 60 * 1000), // 24 hours from now
        iat: new Date().getTime()
      }));
      return token;
    } catch (error) {
      console.error('Token generation error:', error);
      throw new Error('Failed to generate token');
    }
  },

  // Verify token
  verifyToken(token) {
    try {
      if (!token) return null;
      
      // Decode and parse the token
      const decoded = JSON.parse(atob(token));
      
      // Check if token is expired
      if (decoded.exp < new Date().getTime()) {
        return null;
      }
      
      return decoded;
    } catch (error) {
      console.error('Token verification error:', error);
      return null;
    }
  },

  // Set token in cookie
  setTokenCookie(token) {
    document.cookie = `token=${token}; path=/; max-age=86400; secure; samesite=strict`;
  },

  // Remove token from cookie
  removeTokenCookie() {
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  }
}; 