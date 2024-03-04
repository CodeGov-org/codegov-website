const menuOpenBtn = document.querySelector('[data-menu-open]');
if (!menuOpenBtn) {
  throw new Error('Could not find menu trigger');
}

const menuCloseBtn = document.querySelector('[data-menu-close]');
if (!menuCloseBtn) {
  throw new Error('Could not find menu trigger');
}

const menu = document.querySelector('[data-menu]');
if (!menu) {
  throw new Error('Could not find menu');
}

const sidenavBackdrop = document.querySelector('[data-sidenav-backdrop]');
if (!sidenavBackdrop) {
  throw new Error('Could not find sidenav backdrop');
}

menuOpenBtn.addEventListener('click', () => {
  menu.classList.remove('navbar__mobile-nav--closed');
});

sidenavBackdrop.addEventListener('click', () => {
  menu.classList.add('navbar__mobile-nav--closed');
});

menuCloseBtn.addEventListener('click', () => {
  menu.classList.add('navbar__mobile-nav--closed');
});
