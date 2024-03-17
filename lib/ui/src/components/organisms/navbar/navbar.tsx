import { Component, Host, Prop, h } from '@stencil/core';
import { NavLink, NavLinkCategory } from '../../../types';

function isLinkCategory(
  link: NavLinkCategory | NavLink,
): link is NavLinkCategory {
  return 'children' in link;
}

@Component({
  tag: 'cg-navbar',
  styleUrl: 'navbar.scss',
  scoped: true,
})
export class Navbar {
  @Prop()
  public homeUrl = '/';

  @Prop()
  public links: Array<NavLink | NavLinkCategory> = [];

  render() {
    return (
      <Host class="navbar">
        <div class="navbar__inner">
          <nav class="navbar__nav">
            <a href={this.homeUrl} class="navbar__brand">
              <img
                class="navbar__logo"
                src="assets/codegov-logo.png"
                alt="CodeGov Logo"
              />
              codegov.org
            </a>

            <div class="navbar__desktop-nav">
              {this.links.map(item =>
                isLinkCategory(item) ? (
                  <cg-dropdown>
                    <cg-dropdown-trigger slot="dropdownTrigger">
                      {item.title}
                    </cg-dropdown-trigger>
                    <cg-dropdown-menu slot="dropdownMenu">
                      {item.children.map(child => (
                        <cg-cg-dropdown-link-menu-item href={child.url}>
                          {child.title}
                        </cg-cg-dropdown-link-menu-item>
                      ))}
                    </cg-dropdown-menu>
                  </cg-dropdown>
                ) : (
                  <a href={item.url} class="navbar__nav-item">
                    {item.title}
                  </a>
                ),
              )}
            </div>

            <cg-sidenav class="sidenav" homeUrl="/" links={this.links} />
          </nav>
        </div>
        <slot />
      </Host>
    );
  }
}
