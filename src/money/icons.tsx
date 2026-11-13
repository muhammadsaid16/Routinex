import React from 'react';
import {
  Home,
  UtensilsCrossed,
  Car,
  HeartPulse,
  Dumbbell,
  Repeat,
  Gamepad2,
  ShoppingBag,
  GraduationCap,
  Shapes,
  TrendingUp,
} from 'lucide-react';
import { getCategory } from './types';

export const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Home,
  UtensilsCrossed,
  Car,
  HeartPulse,
  Dumbbell,
  Repeat,
  Gamepad2,
  ShoppingBag,
  GraduationCap,
  Shapes,
  TrendingUp,
};

/**
 * The icon of a money category.
 * No colour chip, the icon follows the theme on its own.
 */
export const CategoryIcon: React.FC<{ category: string; className?: string }> = ({
  category,
  className = 'w-4 h-4',
}) => {
  const Icon = CATEGORY_ICONS[getCategory(category).icon] || Shapes;
  return <Icon className={className} />;
};
