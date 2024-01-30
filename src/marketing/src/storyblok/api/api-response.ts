import type { ISbResult } from '@storyblok/astro';

export type ApiResponse<T> = Omit<ISbResult, 'data'> & {
  data: T;
};
