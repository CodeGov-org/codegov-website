import { formatInTimeZone } from 'date-fns-tz';

export function dateToRfc3339(date: Date): string {
  return formatInTimeZone(date, 'UTC', "yyyy-MM-dd'T'HH:mm:ssxxx");
}
