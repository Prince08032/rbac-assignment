import bcrypt from 'bcryptjs';

export const passwordUtils = {
  // Hash password
  async hashPassword(password) {
    try {
      if (!password) throw new Error('Password is required');
      const salt = await bcrypt.genSalt(10);
      return bcrypt.hash(password, salt);
    } catch (error) {
      console.error('Hash password error:', error);
      throw new Error('Error hashing password');
    }
  },

  // Compare password
  async comparePassword(inputPassword, hashedPassword) {
    try {
      if (!inputPassword || !hashedPassword) {
        throw new Error('Both password and hash are required');
      }
      return await bcrypt.compare(String(inputPassword), String(hashedPassword));
    } catch (error) {
      console.error('Compare password error:', error);
      return false; // Return false instead of throwing error
    }
  }
}; 