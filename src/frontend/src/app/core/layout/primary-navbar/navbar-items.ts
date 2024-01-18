export interface NavbarLink {
  title: string;
  href: string;
}

export interface NavbarDropdown {
  title: string;
  children: NavbarLink[];
}

export type NavbarItem = NavbarLink | NavbarDropdown;

const NAVBAR_ITEMS: NavbarItem[] = [
  {
    title: 'Organization',
    children: [
      {
        title: 'Manifesto',
        href: '/organization/manifesto',
      },
      {
        title: 'People',
        href: '/organization/people',
      },
      {
        title: 'Roadmap',
        href: '/organization/roadmap',
      },
    ],
  },
  {
    title: 'Education',
    children: [
      {
        title: 'Resources',
        href: '/education/resources',
      },
      {
        title: 'Training',
        href: '/education/training',
      },
    ],
  },
  {
    title: 'Participation',
    children: [
      {
        title: 'DSCVR Portal',
        href: '/participation/dscvr-portal',
      },
      {
        title: 'Deliverables',
        href: '/participation/deliverables',
      },
    ],
  },
  {
    title: 'Apply',
    href: '/apply',
  },
];

export default NAVBAR_ITEMS;
