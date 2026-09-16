import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge conditional class names, with later Tailwind classes winning. */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
