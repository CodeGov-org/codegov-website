import { Component, Element, Host, Prop, State, Watch, h } from '@stencil/core';
import { animation, reverseAnimation } from '../../animations';

export interface SidenavLinkCategory {
  title: string;
  children: SidenavLink[];
}

export interface SidenavLink {
  title: string;
  url: string;
}

function isLinkCategory(
  link: SidenavLinkCategory | SidenavLink,
): link is SidenavLinkCategory {
  return 'children' in link;
}

const sidenavAnimation: PropertyIndexedKeyframes = {
  right: ['-100%', '0'],
};

@Component({
  tag: 'cg-sidenav',
  styleUrl: 'sidenav.scss',
  scoped: true,
})
export class SidenavComponent {
  @Prop()
  public homeUrl = '/';

  @Prop()
  public links: Array<SidenavLink | SidenavLinkCategory> = [];

  @State()
  public isOpen = false;

  @Element()
  public host!: HTMLElement;

  private sidenavElem!: HTMLDivElement;

  @Watch('isOpen')
  public async onIsOpenChanged(isOpen: boolean): Promise<void> {
    if (isOpen) {
      await this.openAnimation();
    } else {
      await this.closeAnimation();
    }
  }

  public render() {
    return (
      <Host>
        <cg-icon-btn
          label="Open menu"
          onClick={() => {
            this.isOpen = true;
          }}
        >
          <cg-hamburger-icon />
        </cg-icon-btn>

        <cg-overlay
          isOpen={this.isOpen}
          onClick={() => (this.isOpen = false)}
        />

        <div class="sidenav" ref={elem => this.setSidenavElem(elem)}>
          <cg-icon-btn
            class="sidenav__close-btn"
            label="Close menu"
            onClick={() => {
              this.isOpen = false;
            }}
          >
            <cg-close-icon />
          </cg-icon-btn>

          <cg-link-text-btn href={this.homeUrl} class="sidenav__brand">
            <cg-logo-icon class="sidenav__brand-logo" aria-hidden />

            <span class="sidenav__brand-company">codegov.org</span>
          </cg-link-text-btn>

          <nav class="sidebar__nav">
            {this.links.map(item =>
              isLinkCategory(item) ? (
                <cg-collapsible>
                  <div slot="collapsibleTrigger">{item.title}</div>

                  <div slot="collapsibleContent">
                    {item.children.map(child => (
                      <cg-link-text-btn href={child.url} class="sidenav__item">
                        {child.title}
                      </cg-link-text-btn>
                    ))}
                  </div>
                </cg-collapsible>
              ) : (
                <cg-link-text-btn href={item.url} class="sidenav__item">
                  {item.title}
                </cg-link-text-btn>
              ),
            )}
          </nav>
        </div>
      </Host>
    );
  }

  private setSidenavElem(elem?: HTMLDivElement): void {
    if (!elem) {
      throw new Error('Sidenav element not found');
    }

    if (elem !== this.sidenavElem) {
      this.sidenavElem = elem;

      this.sidenavElem.style.display = 'none';
      this.sidenavElem.hidden = true;
      this.sidenavElem.style.right = '-100%';
    }
  }

  private async openAnimation(): Promise<void> {
    this.sidenavElem.style.display = 'block';
    this.sidenavElem.hidden = false;

    await this.sidenavElem.animate(sidenavAnimation, animation).finished;

    this.sidenavElem.style.right = '0';
  }

  private async closeAnimation(): Promise<void> {
    await this.sidenavElem.animate(sidenavAnimation, reverseAnimation).finished;

    this.sidenavElem.style.display = 'none';
    this.sidenavElem.hidden = true;
    this.sidenavElem.style.right = '-100%';
  }
}