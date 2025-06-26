
import { supabase } from './db';
import { User, Message, Room } from '@shared/schema';

export class SupabaseStorage {
  async createUser(userData: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    if (!supabase) throw new Error('Supabase not initialized');
    
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    if (!supabase) throw new Error('Supabase not initialized');
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async getUser(id: number): Promise<User | null> {
    if (!supabase) throw new Error('Supabase not initialized');
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async createRoom(roomData: Omit<Room, 'id' | 'createdAt'>): Promise<Room> {
    if (!supabase) throw new Error('Supabase not initialized');
    
    const { data, error } = await supabase
      .from('rooms')
      .insert([roomData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async getRooms(): Promise<Room[]> {
    if (!supabase) throw new Error('Supabase not initialized');
    
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .order('createdAt', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }

  async createMessage(messageData: Omit<Message, 'id' | 'createdAt'>): Promise<Message> {
    if (!supabase) throw new Error('Supabase not initialized');
    
    const { data, error } = await supabase
      .from('messages')
      .insert([messageData])
      .select(`
        *,
        user:users(id, username)
      `)
      .single();
    
    if (error) throw error;
    return data;
  }

  async getMessages(roomId: number): Promise<Message[]> {
    if (!supabase) throw new Error('Supabase not initialized');
    
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        user:users(id, username)
      `)
      .eq('roomId', roomId)
      .order('createdAt', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }

  // Session store placeholder - use memory store for sessions
  sessionStore = null;
}

export const supabaseStorage = new SupabaseStorage();
