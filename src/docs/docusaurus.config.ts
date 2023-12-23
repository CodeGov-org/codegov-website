import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'CodeGov',
  tagline: 'Catalyzing participation in ICP replica version management',
  favicon: 'img/codegov-logo.png',
  url: 'https://docs.codegov.org',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'throw',
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/codegov-logo.png',
    navbar: {
      title: 'CodeGov Docs',
      logo: {
        alt: 'CodeGov',
        src: 'img/codegov-logo.png',
      },
      items: [],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Review Pimers',
              to: '/',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'OpenChat',
              href: 'https://oc.app/community/32l35-yaaaa-aaaar-aw57q-cai/?ref=4y2h7-aaaaa-aaaaf-ahhca-cai',
            },
            {
              label: 'DSCVR',
              href: 'https://dscvr.one/p/codegov',
            },
            {
              label: 'Twitter',
              href: 'https://twitter.com/codegovorg',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/CodeGov-org',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} CodeGov Org.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
