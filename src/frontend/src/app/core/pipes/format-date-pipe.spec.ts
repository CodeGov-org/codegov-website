import { FormatDatePipe } from './format-date-pipe';

describe('FormatDatePipe', () => {
  const locale = 'en-US';
  const pipe = new FormatDatePipe(locale);

  it('transforms date to medium format', () => {
    expect(pipe.transform(new Date(2024, 1, 17, 1, 1, 25))).toBe(
      'Feb 17, 2024, 1:01:25 AM',
    );
  });
});
