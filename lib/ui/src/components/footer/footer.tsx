import { Component, Prop, h } from '@stencil/core';

export interface FooterLinkCategory {
  title: string;
  children: FooterLink[];
}

export interface FooterLink {
  title: string;
  url: string;
}

@Component({
  tag: 'cg-footer',
  styleUrl: 'footer.scss',
  scoped: true,
})
export class FooterComponent {
  @Prop()
  public links: FooterLinkCategory[] = [];

  public render() {
    return (
      <footer class="footer">
        <div class="footer__main">
          {this.links.map(category => (
            <div class="footer__link-category-container">
              <h2 class="footer__link-category-title">{category.title}</h2>

              <ul class="footer__link-category">
                {category.children.map(link => (
                  <li>
                    <a href={link.url} class="footer__link">
                      {link.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div class="footer__copyright">
          <div class="footer__copyright-content">
            <span class="footer__copyright-text">
              <slot name="footerCopyright" />
            </span>
          </div>
        </div>
      </footer>
    );
  }
}
