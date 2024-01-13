export interface Profile {
  role: string;
  proposalTypes: string[];
  username: string;
  neuronId: string;
  bio: string;
  socialMedia: SocialLink[];
}

export interface UpdatableProfile {
  username: string;
  bio: string;
  socialMedia: SocialLink[];
}

export interface SocialLink {
  type: SocialMediaType;
  link: string;
}

export enum SocialMediaType {
  DSCVR = 'DSCVR',
  OpenChat = 'OpenChat',
  Taggr = 'Taggr',
  X = 'X',
  DfinityForum = 'DfinityForum',
  Discord = 'Discord',
}
