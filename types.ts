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

export interface Marker {
  id: string;
  x: number; 
  y: number; 
  layer: LayerType;
  comment: string;
  // Layer-specific data
  emotion?: EmotionType;
  need?: 'Autonomy' | 'Competence' | 'Relatedness';
  brief_type?: 'Opportunity' | 'Pain Point' | 'Insight';
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