// FIX: Replaced non-existent 'Cube' icon with 'Box' from lucide-react.
import { Heart, Shield, HandHeart, Compass, Paintbrush, Pencil, Grid, Castle, Box, Drama, PenLine } from 'lucide-react';
import { Language } from './types';

export const LANGUAGES: { code: Language; label: string; flag: string; primary: boolean; }[] = [
  { code: 'en', label: 'EN', flag: '🇺🇸', primary: true },
  { code: 'id', label: 'ID', flag: '🇮🇩', primary: true },
  { code: 'jv', label: 'Javanese', flag: '🇮🇩', primary: false },
  { code: 'su', label: 'Sundanese', flag: '🇮🇩', primary: false },
  { code: 'ar', label: 'Arabic', flag: '🇸🇦', primary: false },
  { code: 'hi', label: 'Hindi', flag: '🇮🇳', primary: false },
  { code: 'es', label: 'Español', flag: '🇪🇸', primary: false },
  { code: 'fr', label: 'Français', flag: '🇫🇷', primary: false },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪', primary: false },
  { code: 'zh', label: '中文', flag: '🇨🇳', primary: false },
  { code: 'ja', label: '日本語', flag: '🇯🇵', primary: false },
  { code: 'pt', label: 'Português', flag: '🇧🇷', primary: false },
  { code: 'ru', label: 'Русский', flag: '🇷🇺', primary: false },
  { code: 'it', label: 'Italiano', flag: '🇮🇹', primary: false },
  { code: 'ko', label: '한국어', flag: '🇰🇷', primary: false },
  { code: 'tr', label: 'Türkçe', flag: '🇹🇷', primary: false },
  { code: 'nl', label: 'Nederlands', flag: '🇳🇱', primary: false },
  { code: 'pl', label: 'Polski', flag: '🇵🇱', primary: false },
];

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
    { value: 'very_short', labelKey: 'length.very_short' },
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