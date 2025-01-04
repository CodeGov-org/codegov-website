import { Ok, toCandidOpt } from '../../utils';
import {
  GetMyUserProfileResponse as GetMyUserProfileApiResponse,
  UpdateMyUserProfileRequest as UpdateMyUserProfileApiRequest,
  UserProfile as ApiUserProfile,
  SocialLink as ApiSocialLink,
  SocialLinkPlatform as ApiSocialLinkPlatform,
  ListReviewerProfilesResponse as ListReviewerProfilesApiResponse,
  CreateMyUserProfileResponse as CreateMyUserProfileApiResponse,
} from '@cg/backend';
import {
  CreateMyUserProfileResponse,
  GetMyUserProfileResponse,
  ListReviewerProfilesResponse,
  SocialMediaLink,
  SocialMediaLinkType,
  UpdateMyUserProfileRequest,
  UserRole,
} from './profile-api.model';

function mapUserProfileResponse(res: ApiUserProfile): GetMyUserProfileResponse {
  if ('reviewer' in res.config) {
    const config = res.config.reviewer;

    return {
      role: UserRole.Reviewer,
      id: res.id,
      username: res.username,
      bio: config.bio,
      neuronId: config.neuron_id,
      walletAddress: config.wallet_address,
      socialMedia: mapSocialLinksResponse(config.social_links),
    };
  } else if ('admin' in res.config) {
    return {
      role: UserRole.Admin,
      id: res.id,
      username: res.username,
      bio: res.config.admin.bio,
    };
  } else {
    return {
      role: UserRole.Anonymous,
      id: res.id,
      username: res.username,
    };
  }
}

export function mapListReviewerProfilesResponse(
  res: Ok<ListReviewerProfilesApiResponse>,
): ListReviewerProfilesResponse {
  return res.profiles.map(mapUserProfileResponse);
}

export function mapGetMyUserProfileResponse(
  res: Ok<GetMyUserProfileApiResponse>,
): GetMyUserProfileResponse {
  return mapUserProfileResponse(res);
}

export function mapCreateMyUserProfileResponse(
  res: Ok<CreateMyUserProfileApiResponse>,
): CreateMyUserProfileResponse {
  return mapUserProfileResponse(res);
}

function mapSocialLinksResponse(
  socialLinks: ApiSocialLink[],
): SocialMediaLink[] {
  return socialLinks.map(link => ({
    type: mapSocialLinkPlatformResponse(link.platform),
    username: link.username,
  }));
}

function mapSocialLinkPlatformResponse(
  platform: ApiSocialLinkPlatform,
): SocialMediaLinkType {
  if ('dscvr' in platform) {
    return SocialMediaLinkType.DSCVR;
  }

  if ('openchat' in platform) {
    return SocialMediaLinkType.OpenChat;
  }

  if ('taggr' in platform) {
    return SocialMediaLinkType.Taggr;
  }

  if ('x' in platform) {
    return SocialMediaLinkType.X;
  }

  if ('github' in platform) {
    return SocialMediaLinkType.Github;
  }

  if ('dfinityforum' in platform) {
    return SocialMediaLinkType.DfinityForum;
  }

  if ('discord' in platform) {
    return SocialMediaLinkType.Discord;
  }

  if ('website' in platform) {
    return SocialMediaLinkType.Website;
  }

  throw new Error(`Unknown social link platform: ${JSON.stringify(platform)}`);
}

export function mapUpdateMyUserProfileRequest(
  req: UpdateMyUserProfileRequest,
): UpdateMyUserProfileApiRequest {
  switch (req.role) {
    case UserRole.Anonymous: {
      return {
        username: toCandidOpt(req.username),
        config: toCandidOpt(),
      };
    }

    case UserRole.Reviewer: {
      return {
        username: toCandidOpt(req.username),
        config: toCandidOpt(
          req.bio || req.socialMedia || req.walletAddress
            ? {
                reviewer: {
                  bio: toCandidOpt(req.bio),
                  social_links: toCandidOpt(
                    mapSocialLinksRequest(req.socialMedia),
                  ),
                  wallet_address: toCandidOpt(req.walletAddress),
                },
              }
            : undefined,
        ),
      };
    }

    case UserRole.Admin: {
      return {
        username: toCandidOpt(req.username),
        config: toCandidOpt(
          req.bio
            ? {
                admin: {
                  bio: toCandidOpt(req.bio),
                },
              }
            : undefined,
        ),
      };
    }
  }
}

function mapSocialLinksRequest(
  links?: SocialMediaLink[],
): ApiSocialLink[] | undefined {
  return links?.map(link => ({
    platform: mapSocialLinkPlatformRequest(link.type),
    username: link.username,
  }));
}

function mapSocialLinkPlatformRequest(
  platform: SocialMediaLinkType,
): ApiSocialLinkPlatform {
  switch (platform) {
    case SocialMediaLinkType.DSCVR:
      return { dscvr: null };

    case SocialMediaLinkType.OpenChat:
      return { openchat: null };

    case SocialMediaLinkType.Taggr:
      return { taggr: null };

    case SocialMediaLinkType.X:
      return { x: null };

    case SocialMediaLinkType.Github:
      return { github: null };

    case SocialMediaLinkType.DfinityForum:
      return { dfinityforum: null };

    case SocialMediaLinkType.Discord:
      return { discord: null };

    case SocialMediaLinkType.Website:
      return { website: null };
  }
}
