import {
  CreateMyUserProfileResponse,
  GetMyUserProfileResponse,
  UpdateMyUserProfileRequest,
} from '@cg/backend';
import { Ok, optional } from '~core/utils';
import { Profile, ProfileUpdate, UserRole } from './profile.model';

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
      proposalTypes: [],
      socialMedia: [],
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
          profile.bio || profile.walletAddress
            ? {
                reviewer: {
                  bio: optional(profile.bio),
                  wallet_address: optional(profile.walletAddress),
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
