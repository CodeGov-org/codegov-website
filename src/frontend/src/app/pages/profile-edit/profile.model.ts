import { SocialMediaType } from '~core/state';

export type SocialMediaInputs = {
  [K in SocialMediaType]: SocialMediaInputProps;
};

export const SOCIAL_MEDIA_INPUTS: SocialMediaInputs = {
  DSCVR: {
    label: 'DSCVR username',
  },
  OpenChat: {
    label: 'Open Chat canister/user ID',
  },
  Taggr: {
    label: 'TAGGR username',
  },
  X: {
    label: 'X (Twitter) username',
  },
  DfinityForum: {
    label: 'Dfinity Forum username',
  },
  Discord: {
    label: 'Discord username',
  },
};

export interface SocialMediaInputProps {
  label: string;
}
