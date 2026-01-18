import { supabase } from '../supabase';
import { UserProfile, UserPreferences } from '@store/userStore';

export const usersApi = {
  getCurrentUser: async (): Promise<UserProfile> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) throw error;
    return data;
  },

  updateProfile: async (updates: Partial<UserProfile>): Promise<UserProfile> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  updatePreferences: async (prefs: Partial<UserPreferences>): Promise<UserPreferences> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: current } = await supabase
      .from('users')
      .select('preferences')
      .eq('id', user.id)
      .single();

    const merged = { ...current?.preferences, ...prefs };

    const { data, error } = await supabase
      .from('users')
      .update({ preferences: merged })
      .eq('id', user.id)
      .select('preferences')
      .single();

    if (error) throw error;
    return data.preferences;
  },

  uploadAvatar: async (uri: string): Promise<string> => {
    // Upload to Supabase Storage
    const response = await fetch(uri);
    const blob = await response.blob();
    const fileName = `avatar-${Date.now()}.jpg`;

    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, blob);

    if (error) throw error;

    const { data: publicUrl } = supabase.storage
      .from('avatars')
      .getPublicUrl(data.path);

    return publicUrl.publicUrl;
  },
};
