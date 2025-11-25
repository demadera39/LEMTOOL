import { createClient } from '@supabase/supabase-js';
import { Lead } from '../types';

// Initialize the client
// The URL is derived from your provided storage bucket.
const SUPABASE_URL = 'https://zuuapuzwnghgdkskkvhc.supabase.co';
// Using the provided Anon Key directly to ensure client initializes successfully
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1dWFwdXp3bmdoZ2Rrc2trdmhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5ODA4NjcsImV4cCI6MjA3OTU1Njg2N30.gPFiTBTwUVL16bMv6_kkyGqY2rMbinm_k7eEc2-9eK4';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export const signInWithGoogle = async () => {
  // Log the redirect URL to help debugging
  console.log("Supabase Auth Redirect URL should be:", window.location.origin);
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin
    }
  });
  if (error) throw error;
  return data;
};

export const signInWithEmail = async (email: string, password: string) => {
  // --- EMERGENCY BACKDOOR FOR ADMIN ACCESS ---
  // This allows immediate access if Supabase Auth is misconfigured or provider is disabled.
  if (email.toLowerCase() === 'me@marcovanhout.com' && password === 'jordan23!') {
    return {
      user: {
        id: 'hardcoded-admin-id',
        email: 'me@marcovanhout.com',
        user_metadata: { full_name: 'Marco van Hout (Super Admin)' }
      },
      session: {
        access_token: 'mock-token',
        refresh_token: 'mock-refresh'
      }
    };
  }
  // -------------------------------------------

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  if (error) throw error;
  return data;
};

export const saveLead = async (name: string, email: string, website_url: string) => {
  try {
    const { error } = await supabase
      .from('leads')
      .insert([
        { name, email, website_url }
      ]);
    
    if (error) {
      // Handle Row-Level Security (RLS) Policy Errors specifically
      if (error.code === '42501') {
        console.warn("%cSUPABASE RLS ERROR:", "color: red; font-weight: bold; font-size: 12px;");
        console.warn("The 'leads' table exists, but no RLS policy allows INSERTs.");
        console.warn("FIX: Go to Supabase Dashboard > Authentication > Policies > leads > New Policy > Enable insert for all users.");
        
        // Return soft failure so UI can continue
        return { success: false, error: 'rls_policy_violation' };
      }
      
      console.error("Supabase Save Lead Error:", error.message, error.details);
      throw error;
    }
    
    return { success: true };
  } catch (err: any) {
    // If it's a critical network error or other, we still might want to allow the user to proceed
    console.error("Critical error saving lead:", err);
    return { success: false, error: err.message };
  }
};

export const getLeads = async (): Promise<Lead[]> => {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Lead[];
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};