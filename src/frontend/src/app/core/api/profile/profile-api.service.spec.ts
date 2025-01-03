import { TestBed } from '@angular/core/testing';

import { BackendActorService } from '../../services';
import { ApiError, InMemoryCache } from '../../utils';
import {
  GetMyUserProfileResponse as GetMyUserProfileApiResponse,
  UpdateMyUserProfileRequest as UpdateMyUserProfileApiRequest,
  SocialLink as ApiSocialLink,
  ListReviewerProfilesResponse as ListReviewerProfilesApiResponse,
} from '@cg/backend';
import {
  BackendActorServiceMock,
  backendActorServiceMockFactory,
} from '~core/services/backend-actor-service-mock';
import {
  AdminUserProfile,
  AnonymousUserProfile,
  ReviewerUserProfile,
  SocialMediaLink,
  SocialMediaLinkType,
  UpdateMyUserProfileRequest,
  UserRole,
} from './profile-api.model';
import {
  CURRENT_USER_CACHE_TTL,
  ProfileApiService,
  REVIEWER_CACHE_TTL,
} from './profile-api.service';

describe('ProfileApiService', () => {
  let service: ProfileApiService;
  let backendActorServiceMock: BackendActorServiceMock;

  const commonSocialMediaLinks: SocialMediaLink[] = [
    { type: SocialMediaLinkType.DSCVR, username: 'dscvr_username' },
    {
      type: SocialMediaLinkType.DfinityForum,
      username: 'forum_username',
    },
    {
      type: SocialMediaLinkType.Discord,
      username: 'discord_username',
    },
    {
      type: SocialMediaLinkType.Github,
      username: 'github_username',
    },
    {
      type: SocialMediaLinkType.OpenChat,
      username: 'oc_username',
    },
    {
      type: SocialMediaLinkType.Taggr,
      username: 'taggr_username',
    },
    {
      type: SocialMediaLinkType.Website,
      username: 'website_username',
    },
    {
      type: SocialMediaLinkType.X,
      username: 'x_username',
    },
  ];
  const commonApiSocialMediaLinks: ApiSocialLink[] = [
    { platform: { dscvr: null }, username: 'dscvr_username' },
    {
      platform: { dfinityforum: null },
      username: 'forum_username',
    },
    { platform: { discord: null }, username: 'discord_username' },
    { platform: { github: null }, username: 'github_username' },
    { platform: { openchat: null }, username: 'oc_username' },
    { platform: { taggr: null }, username: 'taggr_username' },
    { platform: { website: null }, username: 'website_username' },
    { platform: { x: null }, username: 'x_username' },
  ];

  beforeEach(() => {
    backendActorServiceMock = backendActorServiceMockFactory();

    TestBed.configureTestingModule({
      providers: [
        { provide: BackendActorService, useValue: backendActorServiceMock },
      ],
    });

    service = TestBed.inject(ProfileApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('listReviewerProfiles()', () => {
    const initialDate = new Date();
    beforeEach(() => {
      jasmine.clock().mockDate(initialDate);
      jasmine.clock().install();
    });

    afterEach(() => {
      InMemoryCache.getInstance().clear();
      jasmine.clock().uninstall();
    });

    it('should return a list of reviewer profiles', async () => {
      const res: ReviewerUserProfile[] = [
        {
          id: 'id1',
          role: UserRole.Reviewer,
          username: 'username1',
          bio: 'bio1',
          neuronId: 1n,
          walletAddress: 'walletAddress1',
          socialMedia: commonSocialMediaLinks,
        },
        {
          id: 'id2',
          role: UserRole.Reviewer,
          username: 'username2',
          bio: 'bio2',
          neuronId: 2n,
          walletAddress: 'walletAddress2',
          socialMedia: commonSocialMediaLinks,
        },
      ];
      const apiRes: ListReviewerProfilesApiResponse = {
        ok: {
          profiles: [
            {
              id: 'id1',
              username: 'username1',
              config: {
                reviewer: {
                  bio: 'bio1',
                  neuron_id: 1n,
                  wallet_address: 'walletAddress1',
                  social_links: commonApiSocialMediaLinks,
                },
              },
            },
            {
              id: 'id2',
              username: 'username2',
              config: {
                reviewer: {
                  bio: 'bio2',
                  neuron_id: 2n,
                  wallet_address: 'walletAddress2',
                  social_links: commonApiSocialMediaLinks,
                },
              },
            },
          ],
        },
      };
      backendActorServiceMock.list_reviewer_profiles.and.resolveTo(apiRes);

      const result = await service.listReviewerProfiles();
      expect(result).toEqual(res);

      const cachedCallDate = new Date(
        initialDate.getTime() + REVIEWER_CACHE_TTL - 1_000,
      );
      jasmine.clock().mockDate(cachedCallDate);
      const cachedResult = await service.listReviewerProfiles();
      expect(cachedResult).toEqual(res);

      const uncachedCallDate = new Date(
        initialDate.getTime() + REVIEWER_CACHE_TTL + 1_000,
      );
      jasmine.clock().mockDate(uncachedCallDate);
      const uncachedResult = await service.listReviewerProfiles();
      expect(uncachedResult).toEqual(res);

      expect(
        backendActorServiceMock.list_reviewer_profiles,
      ).toHaveBeenCalledTimes(2);
    });

    it('should throw if an error response is returned', async () => {
      const apiRes: ListReviewerProfilesApiResponse = {
        err: {
          code: 500,
          message: 'Internal server error',
        },
      };
      backendActorServiceMock.list_reviewer_profiles.and.resolveTo(apiRes);

      await expectAsync(service.listReviewerProfiles()).toBeRejectedWith(
        new ApiError(apiRes.err),
      );
    });
  });

  describe('getMyUserProfile()', () => {
    const initialDate = new Date();
    beforeEach(() => {
      jasmine.clock().mockDate(initialDate);
      jasmine.clock().install();
    });

    afterEach(() => {
      InMemoryCache.getInstance().clear();
      jasmine.clock().uninstall();
    });

    it('should return an anonymous user profile', async () => {
      const res: AnonymousUserProfile = {
        id: 'id',
        role: UserRole.Anonymous,
        username: 'username',
      };
      const apiRes: GetMyUserProfileApiResponse = {
        ok: {
          id: 'id',
          username: 'username',
          config: {
            anonymous: null,
          },
        },
      };

      backendActorServiceMock.get_my_user_profile.and.resolveTo(apiRes);

      const result = await service.getMyUserProfile();
      expect(result).toEqual(res);

      const cachedCallDate = new Date(
        initialDate.getTime() + CURRENT_USER_CACHE_TTL - 1_000,
      );
      jasmine.clock().mockDate(cachedCallDate);
      const cachedResult = await service.getMyUserProfile();
      expect(cachedResult).toEqual(res);

      const uncachedCallDate = new Date(
        initialDate.getTime() + CURRENT_USER_CACHE_TTL + 1_000,
      );
      jasmine.clock().mockDate(uncachedCallDate);
      const uncachedResult = await service.getMyUserProfile();
      expect(uncachedResult).toEqual(res);

      expect(backendActorServiceMock.get_my_user_profile).toHaveBeenCalledTimes(
        2,
      );
    });

    it('should return an admin user profile', async () => {
      const res: AdminUserProfile = {
        id: 'id',
        role: UserRole.Admin,
        username: 'username',
        bio: 'bio',
      };
      const apiRes: GetMyUserProfileApiResponse = {
        ok: {
          id: 'id',
          username: 'username',
          config: {
            admin: {
              bio: 'bio',
            },
          },
        },
      };

      backendActorServiceMock.get_my_user_profile.and.resolveTo(apiRes);

      const result = await service.getMyUserProfile();
      expect(result).toEqual(res);
    });

    it('should return a reviewer user profile', async () => {
      const res: ReviewerUserProfile = {
        id: 'id',
        role: UserRole.Reviewer,
        username: 'username',
        bio: 'bio',
        neuronId: 1n,
        walletAddress: 'walletAddress',
        socialMedia: commonSocialMediaLinks,
      };
      const apiRes: GetMyUserProfileApiResponse = {
        ok: {
          id: 'id',
          username: 'username',
          config: {
            reviewer: {
              bio: 'bio',
              neuron_id: 1n,
              wallet_address: 'walletAddress',
              social_links: commonApiSocialMediaLinks,
            },
          },
        },
      };

      backendActorServiceMock.get_my_user_profile.and.resolveTo(apiRes);

      const result = await service.getMyUserProfile();
      expect(result).toEqual(res);
    });

    it('should throw if an error response is returned', async () => {
      const apiRes: GetMyUserProfileApiResponse = {
        err: {
          code: 500,
          message: 'Internal server error',
        },
      };
      backendActorServiceMock.get_my_user_profile.and.resolveTo(apiRes);

      await expectAsync(service.getMyUserProfile()).toBeRejectedWith(
        new ApiError(apiRes.err),
      );
    });
  });

  describe('updateMyUserProfile()', () => {
    type TestCase = [
      string,
      UpdateMyUserProfileRequest,
      UpdateMyUserProfileApiRequest,
    ];

    const testCases: TestCase[] = [
      [
        'anonymous',
        {
          role: UserRole.Anonymous,
          username: 'username',
        },
        {
          username: ['username'],
          config: [],
        },
      ],
      [
        'anonymous without username',
        {
          role: UserRole.Anonymous,
        },
        {
          username: [],
          config: [],
        },
      ],
      [
        'admin',
        {
          role: UserRole.Admin,
          username: 'username',
          bio: 'bio',
        },
        {
          username: ['username'],
          config: [
            {
              admin: {
                bio: ['bio'],
              },
            },
          ],
        },
      ],
      [
        'admin without username',
        {
          role: UserRole.Admin,
          bio: 'bio',
        },
        {
          username: [],
          config: [
            {
              admin: {
                bio: ['bio'],
              },
            },
          ],
        },
      ],
      [
        'admin without bio',
        {
          role: UserRole.Admin,
          username: 'username',
        },
        {
          username: ['username'],
          config: [],
        },
      ],
      [
        'admin without bio or username',
        {
          role: UserRole.Admin,
        },
        {
          username: [],
          config: [],
        },
      ],
      [
        'reviewer',
        {
          role: UserRole.Reviewer,
          bio: 'bio',
          username: 'username',
          walletAddress: 'walletAddress',
          socialMedia: commonSocialMediaLinks,
        },
        {
          username: ['username'],
          config: [
            {
              reviewer: {
                bio: ['bio'],
                wallet_address: ['walletAddress'],
                social_links: [commonApiSocialMediaLinks],
              },
            },
          ],
        },
      ],
      [
        'reviewer without bio',
        {
          role: UserRole.Reviewer,
          username: 'username',
          walletAddress: 'walletAddress',
          socialMedia: commonSocialMediaLinks,
        },
        {
          username: ['username'],
          config: [
            {
              reviewer: {
                bio: [],
                wallet_address: ['walletAddress'],
                social_links: [commonApiSocialMediaLinks],
              },
            },
          ],
        },
      ],
      [
        'reviewer without username',
        {
          role: UserRole.Reviewer,
          bio: 'bio',
          walletAddress: 'walletAddress',
          socialMedia: commonSocialMediaLinks,
        },
        {
          username: [],
          config: [
            {
              reviewer: {
                bio: ['bio'],
                wallet_address: ['walletAddress'],
                social_links: [commonApiSocialMediaLinks],
              },
            },
          ],
        },
      ],
      [
        'reviewer without wallet address',
        {
          role: UserRole.Reviewer,
          bio: 'bio',
          username: 'username',
          socialMedia: commonSocialMediaLinks,
        },
        {
          username: ['username'],
          config: [
            {
              reviewer: {
                bio: ['bio'],
                wallet_address: [],
                social_links: [commonApiSocialMediaLinks],
              },
            },
          ],
        },
      ],
      [
        'reviewer without social links',
        {
          role: UserRole.Reviewer,
          bio: 'bio',
          username: 'username',
          walletAddress: 'walletAddress',
        },
        {
          username: ['username'],
          config: [
            {
              reviewer: {
                bio: ['bio'],
                wallet_address: ['walletAddress'],
                social_links: [],
              },
            },
          ],
        },
      ],
      [
        'reviewer without bio, username, wallet address, or social links',
        {
          role: UserRole.Reviewer,
        },
        {
          username: [],
          config: [],
        },
      ],
    ];

    testCases.forEach(([description, req, apiReq]) => {
      it(`should update a user profile: ${description}`, async () => {
        backendActorServiceMock.update_my_user_profile.and.resolveTo({
          ok: null,
        });

        const result = await service.updateMyUserProfile(req);
        expect(result).toBeNull();
        expect(
          backendActorServiceMock.update_my_user_profile,
        ).toHaveBeenCalledWith(apiReq);
      });
    });

    it('should throw if an error response is returned', async () => {
      const apiRes: GetMyUserProfileApiResponse = {
        err: {
          code: 500,
          message: 'Internal server error',
        },
      };
      backendActorServiceMock.update_my_user_profile.and.resolveTo(apiRes);

      await expectAsync(
        service.updateMyUserProfile({
          role: UserRole.Anonymous,
          username: 'username',
        }),
      ).toBeRejectedWith(new ApiError(apiRes.err));
    });
  });

  describe('createMyUserProfile()', () => {
    it('should create an anonymous user profile', async () => {
      const res: AnonymousUserProfile = {
        id: 'id',
        role: UserRole.Anonymous,
        username: 'username',
      };
      const apiRes: GetMyUserProfileApiResponse = {
        ok: {
          id: 'id',
          username: 'username',
          config: {
            anonymous: null,
          },
        },
      };

      backendActorServiceMock.create_my_user_profile.and.resolveTo(apiRes);

      const result = await service.createMyUserProfile();
      expect(result).toEqual(res);
    });

    it('should throw if an error response is returned', async () => {
      const apiRes: GetMyUserProfileApiResponse = {
        err: {
          code: 500,
          message: 'Internal server error',
        },
      };
      backendActorServiceMock.create_my_user_profile.and.resolveTo(apiRes);

      await expectAsync(service.createMyUserProfile()).toBeRejectedWith(
        new ApiError(apiRes.err),
      );
    });
  });
});
