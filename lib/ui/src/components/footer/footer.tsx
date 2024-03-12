import { Component, h } from '@stencil/core';

@Component({
  tag: 'cg-footer',
  styleUrl: 'footer.scss',
  scoped: true,
})
export class FooterComponent {
  public render() {
    return (
      <footer class="footer">
        <div class="footer__main">
          <slot name="footerMain" />
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
