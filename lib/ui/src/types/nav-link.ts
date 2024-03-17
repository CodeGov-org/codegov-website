export interface NavLinkCategory {
  title: string;
  children: NavLink[];
}

export interface NavLink {
  title: string;
  url: string;
}

export function isLinkCategory(
  link: NavLinkCategory | NavLink,
): link is NavLinkCategory {
  return 'children' in link;
}
