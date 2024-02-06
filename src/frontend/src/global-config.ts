export interface Link {
  title: string;
  url: string;
}

export interface LinkCategory {
  title: string;
  children: Link[];
}

export interface GlobalConfig {
  headerLinks: Array<LinkCategory | Link>;
  footerLinks: LinkCategory[];
}

export function isLinkCategory(
  link: LinkCategory | Link,
): link is LinkCategory {
  return 'children' in link;
}

import * as globalConfig from './global-config.json';

export const GLOBAL_CONFIG = globalConfig as GlobalConfig;
