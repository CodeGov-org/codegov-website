function pad(num: number): string {
  return num < 10 ? '0' + String(num) : String(num);
}

export function dateToRfc3339(date: Date): string {
  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';

  const absOffset = Math.abs(offset);
  const padOffset = absOffset < 600 ? '0' : '';
  const offsetHours = Math.floor(absOffset / 60);

  const offsetMinutes = pad(absOffset % 60);
  const offsetString = `${sign}${padOffset}${offsetHours}:${offsetMinutes}`;

  return (
    date.getFullYear() +
    '-' +
    pad(date.getMonth() + 1) +
    '-' +
    pad(date.getDate()) +
    'T' +
    pad(date.getHours()) +
    ':' +
    pad(date.getMinutes()) +
    ':' +
    pad(date.getSeconds()) +
    offsetString
  );
}
