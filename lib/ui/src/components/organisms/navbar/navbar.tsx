import { Component, Prop, h } from '@stencil/core';
import { NavLink, NavLinkCategory, isLinkCategory } from '../../../types';

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
      <header class="navbar">
        <div class="navbar__inner">
          <nav class="navbar__nav">
            <cg-link-text-btn href={this.homeUrl} class="navbar__brand">
              <cg-logo-icon class="navbar__logo" aria-hidden />
              codegov.org
            </cg-link-text-btn>

            <div class="navbar__desktop-nav">
              {this.links.map(item =>
                isLinkCategory(item) ? (
                  <cg-dropdown>
                    <cg-dropdown-trigger slot="dropdownTrigger">
                      {item.title}
                    </cg-dropdown-trigger>
                    <cg-dropdown-menu slot="dropdownMenu">
                      {item.children.map(child => (
                        <cg-dropdown-link-menu-item href={child.url}>
                          {child.title}
                        </cg-dropdown-link-menu-item>
                      ))}
                    </cg-dropdown-menu>
                  </cg-dropdown>
                ) : (
                  <cg-link-text-btn href={item.url} class="navbar__nav">
                    {item.title}
                  </cg-link-text-btn>
                ),
              )}
            </div>

            <cg-sidenav class="sidenav" homeUrl={this.homeUrl} links={this.links} />
          </nav>
        </div>
        <slot />
      </header>
    );
  }
}
