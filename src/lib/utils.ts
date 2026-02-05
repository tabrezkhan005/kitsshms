import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generates a time-based greeting message
 * @returns {string} Greeting message based on current time
 */
export function getTimeBasedGreeting(): string {
  const currentHour = new Date().getHours()

  if (currentHour >= 5 && currentHour < 12) {
    return "Good Morning"
  } else if (currentHour >= 12 && currentHour < 17) {
    return "Good Afternoon"
  } else if (currentHour >= 17 && currentHour < 21) {
    return "Good Evening"
  } else {
    return "Good Night"
  }
}
