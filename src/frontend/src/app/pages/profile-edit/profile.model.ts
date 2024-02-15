import { SocialMediaType } from '~core/state';

export type SocialMediaInputs = {
  [K in SocialMediaType]: SocialMediaInputProps;
};

export const SOCIAL_MEDIA_INPUTS: SocialMediaInputs = {
  DSCVR: {
    label: 'DSCVR',
    formLabel: 'DSCVR username',
    baseUrl: 'https://dscvr.one/u/',
  },
  OpenChat: {
    label: 'OpenChat',
    formLabel: 'Open Chat canister/user ID',
    baseUrl: 'https://oc.app/user/',
  },
  Taggr: {
    label: 'TAGGR',
    formLabel: 'TAGGR username',
    baseUrl: 'https://taggr.link/#/user/',
  },
  X: {
    label: 'X (Twitter)',
    formLabel: 'X (Twitter) username',
    baseUrl: 'https://twitter.com/',
  },
  DfinityForum: {
    label: 'Dfinity Forum',
    formLabel: 'Dfinity Forum username',
    baseUrl: 'https://forum.dfinity.org/u/',
  },
  Discord: {
    label: 'Discord',
    formLabel: 'Discord username',
    baseUrl: 'https://discord.com/users/',
  },
};

export interface SocialMediaInputProps {
  label: string;
  formLabel: string;
  baseUrl: string;
}
