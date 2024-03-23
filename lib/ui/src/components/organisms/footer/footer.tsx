import { Component, Prop, h } from '@stencil/core';
import { NavLinkCategory } from '../../../types';

@Component({
  tag: 'cg-footer',
  styleUrl: 'footer.scss',
  scoped: true,
})
export class FooterComponent {
  @Prop()
  public links!: NavLinkCategory[];

  public currentYear = new Date().getFullYear();

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
              © {this.currentYear} CodeGov™. All Rights Reserved.
            </span>
          </div>
        </div>
      </footer>
    );
  }
}
