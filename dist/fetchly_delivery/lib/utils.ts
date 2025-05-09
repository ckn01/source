import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Convert snake_case to camelCase
export function toCamelCase(snake: string): string {
  return snake.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

// Convert snake_case to Label (space-separated and capitalized)
export function toLabel(snake: string): string {
  return snake.replace(/_/g, ' ').replace(/^\w|\s\w/g, (match) => match.toUpperCase());
}