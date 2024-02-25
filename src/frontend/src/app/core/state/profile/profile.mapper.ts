import {
  CreateMyUserProfileResponse,
  GetMyUserProfileResponse,
  UpdateMyUserProfileRequest,
  SocialLink as ApiSocialLink,
  SocialLinkPlatform,
} from '@cg/backend';
import { Ok, optional } from '~core/utils';
import {
  Profile,
  ProfileUpdate,
  SocialLink,
  SocialMediaType,
  UserRole,
} from './profile.model';

export function mapProfileResponse(
  apiResponse: Ok<GetMyUserProfileResponse> | Ok<CreateMyUserProfileResponse>,
): Profile {
  if ('reviewer' in apiResponse.config) {
    const config = apiResponse.config.reviewer;

    return {
      role: UserRole.Reviewer,
      id: apiResponse.id,
      username: apiResponse.username,
      bio: config.bio,
      neuronId: config.neuron_id,
      walletAddress: config.wallet_address,
      socialMedia: mapSocialLinksResponse(config.social_links),
    };
  } else if ('admin' in apiResponse.config) {
    return {
      role: UserRole.Admin,
      id: apiResponse.id,
      username: apiResponse.username,
      bio: apiResponse.config.admin.bio,
    };
  } else {
    return {
      role: UserRole.Anonymous,
      id: apiResponse.id,
      username: apiResponse.username,
    };
  }
}

export function mapSocialLinksResponse(
  apiResponse: ApiSocialLink[],
): SocialLink[] {
  return apiResponse.map(link => ({
    type: mapSocialLinkPlatform(link.platform),
    username: link.username,
  }));
}

export function mapSocialLinkPlatform(
  platform: SocialLinkPlatform,
): SocialMediaType {
  if ('dscvr' in platform) {
    return SocialMediaType.DSCVR;
  }

  if ('openchat' in platform) {
    return SocialMediaType.OpenChat;
  }

  if ('taggr' in platform) {
    return SocialMediaType.Taggr;
  }

  if ('x' in platform) {
    return SocialMediaType.X;
  }

  if ('github' in platform) {
    return SocialMediaType.Github;
  }

  if ('dfinityforum' in platform) {
    return SocialMediaType.DfinityForum;
  }

  if ('discord' in platform) {
    return SocialMediaType.Discord;
  }

  if ('website' in platform) {
    return SocialMediaType.Website;
  }

  throw new Error(`Unknown social link platform: ${JSON.stringify(platform)}`);
}

export function mapUpdateProfileRequest(
  profile: ProfileUpdate,
): UpdateMyUserProfileRequest {
  switch (profile.role) {
    case UserRole.Anonymous:
    default: {
      return {
        username: optional(profile.username),
        config: [],
      };
    }

    case UserRole.Reviewer: {
      return {
        username: optional(profile.username),
        config: optional(
          profile.bio || profile.walletAddress || profile.socialMedia
            ? {
                reviewer: {
                  bio: optional(profile.bio),
                  wallet_address: optional(profile.walletAddress),
                  social_links: optional(
                    mapProfileUpdateSocialLinksRequest(profile.socialMedia),
                  ),
                },
              }
            : null,
        ),
      };
    }

    case UserRole.Admin: {
      return {
        username: optional(profile.username),
        config: optional(
          profile.bio
            ? {
                admin: {
                  bio: optional(profile.bio),
                },
              }
            : null,
        ),
      };
    }
  }
}

export function mapProfileUpdateSocialLinksRequest(
  socialLinks: SocialLink[] | undefined,
): ApiSocialLink[] {
  if (!socialLinks) {
    return [];
  }

  return socialLinks.map(link => ({
    platform: mapSocialLinkType(link.type),
    username: link.username,
  }));
}

export function mapSocialLinkType(type: SocialMediaType): SocialLinkPlatform {
  switch (type) {
    case SocialMediaType.DSCVR:
      return { dscvr: null };
    case SocialMediaType.OpenChat:
      return { openchat: null };
    case SocialMediaType.Taggr:
      return { taggr: null };
    case SocialMediaType.X:
      return { x: null };
    case SocialMediaType.Github:
      return { github: null };
    case SocialMediaType.DfinityForum:
      return { dfinityforum: null };
    case SocialMediaType.Discord:
      return { discord: null };
    case SocialMediaType.Website:
      return { website: null };
    default:
      throw new Error(`Unknown social link type: ${type}`);
  }
}

export function mergeProfileUpdate(
  profile: Profile,
  profileUpdate: ProfileUpdate,
): Profile {
  // create a new object reference so Angular will detect the changes
  profile = { ...profile };

  if (
    profile.role === UserRole.Anonymous &&
    profileUpdate.role === UserRole.Anonymous
  ) {
    if (profileUpdate.username) {
      profile.username = profileUpdate.username;
    }
  } else if (
    profile.role === UserRole.Reviewer &&
    profileUpdate.role === UserRole.Reviewer
  ) {
    if (profileUpdate.username) {
      profile.username = profileUpdate.username;
    }
    if (profileUpdate.bio) {
      profile.bio = profileUpdate.bio;
    }
    if (profileUpdate.walletAddress) {
      profile.walletAddress = profileUpdate.walletAddress;
    }
    if (profileUpdate.socialMedia) {
      profile.socialMedia = profileUpdate.socialMedia;
    }
  } else if (
    profile.role === UserRole.Admin &&
    profileUpdate.role === UserRole.Admin
  ) {
    if (profileUpdate.username) {
      profile.username = profileUpdate.username;
    }
    if (profileUpdate.bio) {
      profile.bio = profileUpdate.bio;
    }
  } else {
    throw new Error('Users cannot change their own role');
  }

  return profile;
}
