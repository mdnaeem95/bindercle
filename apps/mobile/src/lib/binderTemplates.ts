import type { BinderLayout } from '@/lib/validators/binder';
import type { AccentColor } from '@foilio/ui';
import {
  Cake,
  Heart,
  type LucideIcon,
  Moon,
  Rainbow,
  Search,
  Sparkles,
  Trophy,
  Zap,
} from 'lucide-react-native';

/**
 * Themed scaffolds for the new-binder flow.
 *
 * The point isn't a starter kit of cards — it's a starter kit of *vibe*.
 * A user picks "All the Pikachus" and gets a title, description, tags,
 * accent color, and layout that all already feel cohesive. They can edit
 * any field, but the defaults set the tone.
 */

export interface BinderTemplate {
  id: string;
  /** Picker tile icon. */
  icon: LucideIcon;
  name: string;
  blurb: string;
  /** Pre-filled values. */
  preset: {
    title: string;
    description: string;
    tags: string[];
    accent_color: AccentColor;
    layout_type: BinderLayout;
  };
}

export const BINDER_TEMPLATES: BinderTemplate[] = [
  {
    id: 'master-set',
    icon: Trophy,
    name: 'Master set',
    blurb: 'Every card from one set, every variant.',
    preset: {
      title: 'Master set',
      description: 'Every card from this set — base, holo, reverse, full art, the whole shelf.',
      tags: ['master-set', 'complete'],
      accent_color: 'butter',
      layout_type: 'sixteen_pocket',
    },
  },
  {
    id: 'all-the',
    icon: Zap,
    name: 'All the [Pokemon]',
    blurb: 'Every printing of one Pokemon. Pikachus. Charizards. Squirtles. You decide.',
    preset: {
      title: 'All the Pikachus',
      description: 'Every printing I can find. The classics, the alt arts, the weird ones.',
      tags: ['mono-pokemon', 'completionist'],
      accent_color: 'lemon',
      layout_type: 'nine_pocket',
    },
  },
  {
    id: 'rainbow',
    icon: Rainbow,
    name: 'Rainbow rares',
    blurb: 'Only the iridescent ones.',
    preset: {
      title: 'Rainbow rares',
      description: 'Only rainbow rares. Only the shimmer.',
      tags: ['rainbow-rare', 'shiny-things'],
      accent_color: 'pink',
      layout_type: 'four_pocket',
    },
  },
  {
    id: 'midnight-pulls',
    icon: Moon,
    name: 'Midnight pulls',
    blurb: 'Cards from packs you cracked at launch.',
    preset: {
      title: 'Midnight pulls',
      description: 'Cards I pulled the night the set dropped. Receipts in my notes app.',
      tags: ['midnight', 'pulls', 'launch-day'],
      accent_color: 'lavender',
      layout_type: 'nine_pocket',
    },
  },
  {
    id: 'first-edition',
    icon: Sparkles,
    name: 'First editions',
    blurb: 'The stamped ones. The originals.',
    preset: {
      title: 'First editions',
      description: '1st Edition stamped cards only. The originals.',
      tags: ['first-edition', 'vintage'],
      accent_color: 'cherry',
      layout_type: 'four_pocket',
    },
  },
  {
    id: 'cute-energy',
    icon: Heart,
    name: 'Cute energy',
    blurb: 'Just the ones that made you go "awwww."',
    preset: {
      title: 'Cute energy',
      description: 'A binder of cards that made me go "awwww." No criteria beyond that.',
      tags: ['cute', 'vibes'],
      accent_color: 'rose',
      layout_type: 'nine_pocket',
    },
  },
  {
    id: 'errors-and-misprints',
    icon: Search,
    name: 'Errors & misprints',
    blurb: 'Off-center, miscut, blank backs, weird ones.',
    preset: {
      title: 'Errors & misprints',
      description:
        "Off-center, miscut, blank backs, ink errors. The ones the printer didn't mean to make.",
      tags: ['errors', 'misprints', 'weird'],
      accent_color: 'sage',
      layout_type: 'nine_pocket',
    },
  },
  {
    id: 'birthday-binder',
    icon: Cake,
    name: 'Birthday binder',
    blurb: 'One card from each year. Time capsule.',
    preset: {
      title: 'Birthday binder',
      description: 'One card from every birthday. A timeline of who I was that year.',
      tags: ['birthday', 'timeline', 'sentimental'],
      accent_color: 'peach',
      layout_type: 'four_pocket',
    },
  },
];
