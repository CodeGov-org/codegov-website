import { format } from 'date-fns';

export function dateToRfc3339(date: Date): string {
  return format(date, "yyyy-MM-dd'T'HH:mm:ssxxx");
}
