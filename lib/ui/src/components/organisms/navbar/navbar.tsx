import { Component, ComponentInterface, Prop, h } from '@stencil/core';
import { NavLink, NavLinkCategory, isLinkCategory } from '../../../types';

@Component({
  tag: 'cg-navbar',
  styleUrl: 'navbar.scss',
  scoped: true,
})
export class Navbar implements ComponentInterface {
  @Prop({ reflect: true })
  public homeUrl = '/';

  @Prop({ reflect: true })
  public links: Array<NavLink | NavLinkCategory> = [];

  render() {
    return (
      <header class="navbar">
        <div class="navbar__inner">
          <nav class="navbar__nav">
            <cg-link-text-btn href={this.homeUrl}>
              <span class="navbar__brand">
                <cg-logo-icon class="navbar__logo" aria-hidden />
                codegov.org
              </span>
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
                  <cg-link-text-btn href={item.url}>
                    {item.title}
                  </cg-link-text-btn>
                ),
              )}
            </div>

            <cg-sidenav
              class="navbar__sidenav-trigger"
              homeUrl={this.homeUrl}
              links={this.links}
            />
          </nav>
        </div>
        <slot />
      </header>
    );
  }
}
