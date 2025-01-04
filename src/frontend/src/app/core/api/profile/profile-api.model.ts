/**
 * Generic types
 */

export enum UserRole {
  Anonymous = 'Anonymous',
  Reviewer = 'Reviewer',
  Admin = 'Admin',
}

export enum SocialMediaLinkType {
  DSCVR = 'DSCVR',
  OpenChat = 'OpenChat',
  Taggr = 'Taggr',
  X = 'X',
  Github = 'Github',
  DfinityForum = 'DfinityForum',
  Discord = 'Discord',
  Website = 'Website',
}

export interface SocialMediaLink {
  type: SocialMediaLinkType;
  username: string;
}

export interface BaseUserProfile<T extends UserRole> {
  role: T;
  id: string;
  username: string;
}

export type AnonymousUserProfile = BaseUserProfile<UserRole.Anonymous>;

export interface ReviewerUserProfile
  extends BaseUserProfile<UserRole.Reviewer> {
  neuronId: bigint;
  walletAddress: string;
  bio: string;
  socialMedia: SocialMediaLink[];
}

export interface AdminUserProfile extends BaseUserProfile<UserRole.Admin> {
  bio: string;
}

export type UserProfile =
  | AnonymousUserProfile
  | ReviewerUserProfile
  | AdminUserProfile;

export type ListReviewerProfilesResponse = UserProfile[];

export type GetMyUserProfileResponse = UserProfile;

export type CreateMyUserProfileResponse = UserProfile;

/**
 * UpdateMyUserProfile types
 */

export interface BaseUpdateMyUserProfileRequest<T extends UserRole> {
  role: T;
  username?: string;
}

export type AnonymousUpdateMyUserProfileRequest =
  BaseUpdateMyUserProfileRequest<UserRole.Anonymous>;

export interface ReviewerUpdateMyUserProfileRequest
  extends BaseUpdateMyUserProfileRequest<UserRole.Reviewer> {
  bio?: string;
  socialMedia?: SocialMediaLink[];
  walletAddress?: string;
}

export interface AdminUpdateMyUserProfileRequest
  extends BaseUpdateMyUserProfileRequest<UserRole.Admin> {
  bio?: string;
}

export type UpdateMyUserProfileRequest =
  | AnonymousUpdateMyUserProfileRequest
  | ReviewerUpdateMyUserProfileRequest
  | AdminUpdateMyUserProfileRequest;
