import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a name to proper title case (capitalizes first letter of each word)
 * @param name - The name to format
 * @returns The formatted name
 */
export function formatName(name: string | null | undefined): string {
  if (!name) return '';

  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
