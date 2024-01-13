export enum SocialMediaType {
  DSCVR = 'DSCVR',
  OpenChat = 'OpenChat',
  Taggr = 'Taggr',
  X = 'X',
  DfinityForum = 'DfinityForum',
  Discord = 'Discord',
}

export type SocialMediaInputs = {
  [K in SocialMediaType]: SocialMediaInputProps;
};

export const socialMediaInputs: SocialMediaInputs = {
  DSCVR: { label: 'DSCVR' },
  OpenChat: { label: 'Open Chat' },
  Taggr: { label: 'TAGGR' },
  X: { label: 'X (Twitter)' },
  DfinityForum: { label: 'Dfinity Forum' },
  Discord: { label: 'Discord' },
};

export interface SocialMediaInputProps {
  label: string;
}
