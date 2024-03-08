import { Config } from '@stencil/core';
import { sass } from '@stencil/sass';

export const config: Config = {
  namespace: 'cg-ui',
  plugins: [sass()],
  outputTargets: [
    {
      type: 'dist',
      esmLoaderPath: '../loader',
      isPrimaryPackageOutputTarget: true,
    },
    {
      type: 'dist-custom-elements',
    },
  ],
  validatePrimaryPackageOutputTarget: true,
};
