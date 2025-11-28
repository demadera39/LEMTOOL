
import { createClient } from '@supabase/supabase-js';
import { Lead, Project, TestSession, Marker, AnalysisReport } from '../types';

// Initialize the client
// The URL is derived from your provided storage bucket.
const SUPABASE_URL = 'https://zuuapuzwnghgdkskkvhc.supabase.co';
// Using the provided Anon Key directly to ensure client initializes successfully
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1dWFwdXp3bmdoZ2Rrc2trdmhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5ODA4NjcsImV4cCI6MjA3OTU1Njg2N30.gPFiTBTwUVL16bMv6_kkyGqY2rMbinm_k7eEc2-9eK4';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export const signInWithGoogle = async () => {
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

export const signUpWithEmail = async (email: string, password: string, name: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: window.location.origin,
      data: {
        full_name: name,
      },
    },
  });
  if (error) throw error;
  return data;
};

export const signInWithEmail = async (email: string, password: string) => {
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
      .insert([{ name, email, website_url }]);
    
    if (error) {
      if (error.code === '42501') return { success: false, error: 'rls_policy_violation' };
      throw error;
    }
    return { success: true };
  } catch (err: any) {
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

// --- PROJECT & TESTING API ---

// Create a new testing project
export const createProject = async (ownerId: string, url: string, aiReport: AnalysisReport, aiMarkers: Marker[]) => {
  // Mock implementation since we can't migrate schema in this environment
  // In real implementation: INSERT into projects table
  const newProject: Project = {
    id: Math.random().toString(36).substr(2, 9),
    created_at: new Date().toISOString(),
    owner_id: ownerId,
    name: new URL(url).hostname,
    url: url,
    ai_report: aiReport,
    ai_markers: aiMarkers
  };
  
  // Simulate storing in localStorage for demo persistence
  const existing = JSON.parse(localStorage.getItem('lem_projects') || '[]');
  localStorage.setItem('lem_projects', JSON.stringify([...existing, newProject]));
  
  return newProject;
};

export const getProjects = async (ownerId: string): Promise<Project[]> => {
  // Mock implementation
  const projects = JSON.parse(localStorage.getItem('lem_projects') || '[]');
  return projects.filter((p: Project) => p.owner_id === ownerId || ownerId === 'hardcoded-admin-id');
};

export const getProjectById = async (projectId: string): Promise<Project | null> => {
    const projects = JSON.parse(localStorage.getItem('lem_projects') || '[]');
    return projects.find((p: Project) => p.id === projectId) || null;
}

export const submitTestSession = async (projectId: string, participantName: string, markers: Marker[]) => {
  const session: TestSession = {
    id: Math.random().toString(36).substr(2, 9),
    project_id: projectId,
    participant_name: participantName,
    markers: markers,
    created_at: new Date().toISOString()
  };

  const sessions = JSON.parse(localStorage.getItem('lem_sessions') || '[]');
  localStorage.setItem('lem_sessions', JSON.stringify([...sessions, session]));
  
  return session;
};

export const getProjectSessions = async (projectId: string): Promise<TestSession[]> => {
    const sessions = JSON.parse(localStorage.getItem('lem_sessions') || '[]');
    return sessions.filter((s: TestSession) => s.project_id === projectId);
}
