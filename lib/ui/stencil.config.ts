import { Config } from '@stencil/core';
import { sass } from '@stencil/sass';

export const config: Config = {
  namespace: 'cg-ui',
  plugins: [sass()],
  buildDist: true,
  outputTargets: [
    {
      type: 'dist',
      esmLoaderPath: '../loader',
      isPrimaryPackageOutputTarget: true,
    },
    {
      type: 'dist-custom-elements',
    },
    {
      type: 'www',
      serviceWorker: null,
      copy: [{ src: '**/*.html' }, { src: '**/*.css' }],
    },
  ],
  validatePrimaryPackageOutputTarget: true,
};
