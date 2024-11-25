import { supabase } from './supabase';

export const db = {
  // Get user by ID
  async getUserById(id) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update user
  async updateUser(id, updates) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get all users (admin only)
  async getAllUsers() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Change user role (admin only)
  async changeUserRole(userId, newRole) {
    const { data, error } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Change user status (admin only)
  async changeUserStatus(userId, newStatus) {
    const { data, error } = await supabase
      .from('users')
      .update({ status: newStatus })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
}; 