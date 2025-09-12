import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type PersonaType = Database['public']['Enums']['persona_type'];

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  selectedPersona: PersonaType;
  updatePersona: (persona: PersonaType) => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPersona, setSelectedPersona] = useState<PersonaType | null>(null);
  const [personaLoaded, setPersonaLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    // Set up a timeout fallback to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (isMounted && loading) {
        console.warn('Auth loading timeout - forcing loading to false');
        setLoading(false);
      }
    }, 3000); // Reduced to 3 seconds
    
    // Optimized persona loading function
    const loadPersonaOptimized = async (userId: string) => {
      if (personaLoaded) return; // Prevent duplicate calls
      setPersonaLoaded(true);
      
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('selected_persona')
          .eq('user_id', userId)
          .maybeSingle();
        
        if (error) {
          console.error('Error loading user persona:', error);
          return;
        }
        
        if (profile?.selected_persona) {
          setSelectedPersona(profile.selected_persona);
        } else {
          // Set default persona and create profile asynchronously
          setSelectedPersona('minister');
          supabase
            .from('profiles')
            .insert({
              user_id: userId,
              selected_persona: 'minister',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .then(({ error: insertError }) => {
              if (insertError) {
                console.error('Error creating user profile:', insertError);
              }
            });
        }
      } catch (error) {
        console.error('Error loading user persona:', error);
      }
    };
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        
        if (!isMounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        // Reset persona loaded state when user changes
        if (!session?.user?.id) {
          setPersonaLoaded(false);
          setSelectedPersona(null);
        } else {
          // Load persona asynchronously without blocking
          loadPersonaOptimized(session.user.id);
        }
        
        if (isMounted) {
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      
      if (!isMounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      
      // Load persona asynchronously without blocking
      if (session?.user) {
        loadPersonaOptimized(session.user.id);
      }
      
      if (isMounted) {
        setLoading(false);
      }
    }).catch((error) => {
      console.error('Error getting session:', error);
      if (isMounted) {
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);


  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSelectedPersona(null); // Reset to null
    setPersonaLoaded(false); // Reset persona loaded state
  };

  const updatePersona = async (persona: PersonaType) => {
    if (!user) return;
    
    try {
      // Update local state immediately for better UX
      setSelectedPersona(persona);
      
      // Update database using upsert with proper conflict resolution
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          selected_persona: persona,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });
      
      if (error) {
        console.error('Error updating persona:', error);
        // Revert local state on error
        setSelectedPersona(selectedPersona);
      }
    } catch (error) {
      console.error('Error updating persona:', error);
      setSelectedPersona(selectedPersona);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        selectedPersona,
        updatePersona,
        signUp,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}