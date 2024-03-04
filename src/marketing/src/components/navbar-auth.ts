import { AuthClient } from '@dfinity/auth-client';

const identityProviderElem = document.querySelector('[data-identity-provider]');
if (!identityProviderElem) {
  throw new Error('Could not find identity provider');
}
const identityProvider = identityProviderElem.getAttribute(
  'data-identity-provider',
);
if (!identityProvider) {
  throw new Error('Could not find identity provider');
}

const authButton = document.querySelector('[data-auth-button]');
if (!authButton) {
  throw new Error('Could not find auth button');
}

const profileButton = document.querySelector('[data-profile-button]');
if (!profileButton) {
  throw new Error('Could not find profile button');
}

let authClient: AuthClient | undefined;

AuthClient.create()
  .then(client => {
    authClient = client;

    return authClient.isAuthenticated();
  })
  .then(isAuthenticated => {
    if (isAuthenticated) {
      onLoggedIn();
    } else {
      onLoggedOut();
    }
  });

authButton.addEventListener('click', () => {
  if (authClient) {
    authClient.login({
      identityProvider,
      onSuccess: () => {
        onLoggedIn();
      },
      onError: (err?: string) => {
        onLoggedOut();
        throw new Error(err);
      },
    });
  }
});

function onLoggedIn(): void {
  if (!authButton) {
    throw new Error('Could not find auth button');
  }

  if (!profileButton) {
    throw new Error('Could not find profile button');
  }

  authButton.classList.add('navbar__desktop-auth--hidden');
  profileButton.classList.add('navbar__desktop-profile--visible');
}

function onLoggedOut(): void {
  if (!authButton) {
    throw new Error('Could not find auth button');
  }

  if (!profileButton) {
    throw new Error('Could not find profile button');
  }

  authButton.classList.remove('navbar__desktop-auth--hidden');
  profileButton.classList.remove('navbar__desktop-profile--visible');
}
