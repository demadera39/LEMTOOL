import React from 'react';

export enum EmotionType {
  // Positive
  JOY = 'Joy',
  DESIRE = 'Desire',
  FASCINATION = 'Fascination',
  SATISFACTION = 'Satisfaction',
  // Neutral
  NEUTRAL = 'Neutral',
  // Negative
  SADNESS = 'Sadness',
  DISGUST = 'Disgust',
  BOREDOM = 'Boredom',
  DISSATISFACTION = 'Dissatisfaction'
}

export type LayerType = 'emotions' | 'needs' | 'strategy';

export interface EmotionDef {
  id: EmotionType;
  label: string;
  description: string;
  category: 'Positive' | 'Negative' | 'Neutral';
  icon: React.ComponentType<any>;
  src: string; 
}

export interface AppraisalInput {
  type: 'Goal' | 'Attitude' | 'Norm' | 'Standard';
  prefix: string; // e.g., "I want to..."
  content: string;
}

export interface Marker {
  id: string;
  x: number; 
  y: number; 
  layer: LayerType;
  comment: string;
  source: 'AI' | 'HUMAN'; // Distinguish between AI and real users
  sessionId?: string; // Links to a specific participant session
  
  // Layer-specific data
  emotion?: EmotionType;
  need?: 'Autonomy' | 'Competence' | 'Relatedness';
  brief_type?: 'Opportunity' | 'Pain Point' | 'Insight';
  
  // Human Context
  appraisal?: AppraisalInput;
}

export interface Persona {
  name: string;
  role: string;
  bio: string;
  goals: string;
  quote: string;
  techLiteracy: "Low" | "Mid" | "High";
  psychographics: string; 
  values: string[]; 
  frustrations: string[];
  demographics?: string; 
}

export interface SDTScores {
  autonomy: { score: number; justification: string };
  competence: { score: number; justification: string };
  relatedness: { score: number; justification: string };
}

export interface CreativeBrief {
  problemStatement: string;
  targetEmotion: string;
  howMightWe: string;
  strategicDirection: string;
  actionableSteps?: string[];
  benchmarks?: { name: string; reason: string }[];
}

export interface LayoutSection {
  type: 'hero' | 'features' | 'testimonials' | 'pricing' | 'footer' | 'cta' | 'unknown' | 'social_proof' | 'faq';
  estimatedHeight: number; 
  backgroundColorHint: string;
}

export interface AnalysisReport {
  overallScore: number;
  summary: string;
  targetAudience: string;
  audienceSplit: { label: string; percentage: number }[];
  personas: Persona[];
  brandValues: string[];
  keyFindings: {
    title: string;
    description: string;
    type: 'positive' | 'negative' | 'neutral';
  }[];
  suggestions: string[];
  layoutStructure: LayoutSection[];
  sdtScores: SDTScores;
  creativeBrief: CreativeBrief;
  screenshot?: string; // Base64 string of the analyzed screenshot
}

export interface User {
  id: string;
  email: string;
  name?: string;
  isAdmin?: boolean;
}

export interface Lead {
  id: string;
  created_at: string;
  name: string;
  email: string;
  website_url: string;
}

export interface Project {
  id: string;
  created_at: string;
  owner_id: string;
  name: string;
  url: string;
  ai_report?: AnalysisReport;
  ai_markers?: Marker[];
}

export interface TestSession {
  id: string;
  project_id: string;
  participant_name: string;
  markers: Marker[];
  created_at: string;
}