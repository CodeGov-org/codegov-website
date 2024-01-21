import { SocialMediaType } from '~core/state';

export type SocialMediaInputs = {
  [K in SocialMediaType]: SocialMediaInputProps;
};

export const SOCIAL_MEDIA_INPUTS: SocialMediaInputs = {
  DSCVR: {
    label: 'DSCVR username',
    baseUrl: 'https://dscvr.one/u/',
  },
  OpenChat: {
    label: 'Open Chat canister/user ID',
    baseUrl: 'https://oc.app/user/',
  },
  Taggr: {
    label: 'TAGGR username',
    baseUrl: 'https://taggr.link/#/user/',
  },
  X: {
    label: 'X (Twitter) username',
    baseUrl: 'https://twitter.com/',
  },
  DfinityForum: {
    label: 'Dfinity Forum username',
    baseUrl: 'https://forum.dfinity.org/u/',
  },
  Discord: {
    label: 'Discord username',
    baseUrl: 'https://discord.com/users/',
  },
};

export interface SocialMediaInputProps {
  label: string;
  baseUrl: string;
}
