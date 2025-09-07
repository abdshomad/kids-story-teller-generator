// FIX: Replaced non-existent 'Cube' icon with 'Box' from lucide-react.
import { Heart, Shield, HandHeart, Compass, Paintbrush, Pencil, Grid, Castle, Box, Drama, PenLine } from 'lucide-react';

export const AGE_GROUPS = [
  { value: '3-5 years', labelKey: 'age.3-5' },
  { value: '6-8 years', labelKey: 'age.6-8' }
];

export const THEMES = [
  { value: 'Friendship', labelKey: 'theme.friendship', icon: Heart },
  { value: 'Courage', labelKey: 'theme.courage', icon: Shield },
  { value: 'Being Kind', labelKey: 'theme.kindness', icon: HandHeart },
  { value: 'Adventure', labelKey: 'theme.adventure', icon: Compass },
];

export const STORY_LENGTHS = [
    { value: 'short', labelKey: 'length.short' },
    { value: 'medium', labelKey: 'length.medium' },
    { value: 'long', labelKey: 'length.long' },
];

export const ILLUSTRATION_STYLES = [
  { value: 'Watercolor', labelKey: 'style.watercolor', icon: Paintbrush },
  { value: 'Cartoon', labelKey: 'style.cartoon', icon: Pencil },
  { value: 'Pixel Art', labelKey: 'style.pixel', icon: Grid },
  { value: 'Fantasy', labelKey: 'style.fantasy', icon: Castle },
  { value: '3D Render', labelKey: 'style.3drender', icon: Box },
  { value: 'Claymation', labelKey: 'style.claymation', icon: Drama },
  { value: 'Pencil Sketch', labelKey: 'style.pencilsketch', icon: PenLine },
];

export const SAMPLE_PROMPTS = [
  'prompt.sample1',
  'prompt.sample2',
  'prompt.sample3',
  'prompt.sample4',
];