export enum UserRole {
  Anonymous = 'Anonymous',
  Reviewer = 'Reviewer',
  Admin = 'Admin',
}

export interface BaseProfile<T extends UserRole> {
  role: T;
  id: string;
  username: string;
}

export type AnonymousProfile = BaseProfile<UserRole.Anonymous>;

export interface ReviewerProfile extends BaseProfile<UserRole.Reviewer> {
  proposalTypes: string[];
  neuronId: bigint;
  walletAddress: string;
  bio: string;
  socialMedia: SocialLink[];
}

export interface AdminProfile extends BaseProfile<UserRole.Admin> {
  bio: string;
}

export type Profile = AnonymousProfile | ReviewerProfile | AdminProfile;

export interface BaseProfileUpdate<T extends UserRole> {
  role: T;
  username?: string;
}

export type AnonymousProfileUpdate = BaseProfileUpdate<UserRole.Anonymous>;

export interface ReviewerProfileUpdate
  extends BaseProfileUpdate<UserRole.Reviewer> {
  bio?: string;
  socialMedia?: SocialLink[];
  walletAddress?: string;
}

export interface AdminProfileUpdate extends BaseProfileUpdate<UserRole.Admin> {
  bio?: string;
}

export type ProfileUpdate =
  | AnonymousProfileUpdate
  | ReviewerProfileUpdate
  | AdminProfileUpdate;

export interface SocialLink {
  type: SocialMediaType;
  link: string | undefined;
}

export enum SocialMediaType {
  DSCVR = 'DSCVR',
  OpenChat = 'OpenChat',
  Taggr = 'Taggr',
  X = 'X',
  DfinityForum = 'DfinityForum',
  Discord = 'Discord',
}
