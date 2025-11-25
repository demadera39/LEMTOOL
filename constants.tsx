import { EmotionType, EmotionDef } from './types';
import { 
  Smile, 
  Heart, 
  Zap, 
  ThumbsUp, 
  Frown, 
  AlertTriangle, 
  ThumbsDown,
  Meh,
  CircleDashed
} from 'lucide-react';

export const EMOTIONS: Record<EmotionType, EmotionDef> = {
  [EmotionType.JOY]: {
    id: EmotionType.JOY,
    label: 'Joy',
    description: 'Accomplishment, openness, attainability.',
    category: 'Positive',
    icon: Smile,
    src: 'https://zuuapuzwnghgdkskkvhc.supabase.co/storage/v1/object/public/LEMemotions/joy.png'
  },
  [EmotionType.DESIRE]: {
    id: EmotionType.DESIRE,
    label: 'Desire',
    description: 'Attending to an object, wanting to engage.',
    category: 'Positive',
    icon: Heart,
    src: 'https://zuuapuzwnghgdkskkvhc.supabase.co/storage/v1/object/public/LEMemotions/desire.png'
  },
  [EmotionType.FASCINATION]: {
    id: EmotionType.FASCINATION,
    label: 'Interest',
    description: 'Strong cognitive stimulation, interest.',
    category: 'Positive',
    icon: Zap,
    src: 'https://zuuapuzwnghgdkskkvhc.supabase.co/storage/v1/object/public/LEMemotions/interest.png'
  },
  [EmotionType.SATISFACTION]: {
    id: EmotionType.SATISFACTION,
    label: 'Satisfaction',
    description: 'Meeting expectations comfortably.',
    category: 'Positive',
    icon: ThumbsUp,
    src: 'https://zuuapuzwnghgdkskkvhc.supabase.co/storage/v1/object/public/LEMemotions/satisfaction.png'
  },
  [EmotionType.NEUTRAL]: {
    id: EmotionType.NEUTRAL,
    label: 'Neutral',
    description: 'Indifferent, no specific strong emotional reaction.',
    category: 'Neutral',
    icon: CircleDashed,
    src: 'https://zuuapuzwnghgdkskkvhc.supabase.co/storage/v1/object/public/LEMemotions/neutral.png'
  },
  [EmotionType.SADNESS]: {
    id: EmotionType.SADNESS,
    label: 'Sadness',
    description: 'Absence of value, finality of loss.',
    category: 'Negative',
    icon: Frown,
    src: 'https://zuuapuzwnghgdkskkvhc.supabase.co/storage/v1/object/public/LEMemotions/sadness.png'
  },
  [EmotionType.DISGUST]: {
    id: EmotionType.DISGUST,
    label: 'Aversion',
    description: 'Rejecting an object, offense to senses.',
    category: 'Negative',
    icon: AlertTriangle,
    src: 'https://zuuapuzwnghgdkskkvhc.supabase.co/storage/v1/object/public/LEMemotions/aversion.png'
  },
  [EmotionType.BOREDOM]: {
    id: EmotionType.BOREDOM,
    label: 'Boredom',
    description: 'Absence of stimulation, uninteresting.',
    category: 'Negative',
    icon: Meh,
    src: 'https://zuuapuzwnghgdkskkvhc.supabase.co/storage/v1/object/public/LEMemotions/boredom.png'
  },
  [EmotionType.DISSATISFACTION]: {
    id: EmotionType.DISSATISFACTION,
    label: 'Dissatisfaction',
    description: 'Failing to meet expectations.',
    category: 'Negative',
    icon: ThumbsDown,
    src: 'https://zuuapuzwnghgdkskkvhc.supabase.co/storage/v1/object/public/LEMemotions/dissatisfaction.png'
  },
};