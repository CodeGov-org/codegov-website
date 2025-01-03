import { Actor, generateRandomIdentity } from '@hadronous/pic';
import {
  _SERVICE as BackendService,
  CreateMyUserProfileResponse,
  GetMyUserProfileResponse,
  UserConfigUpdate,
} from '@cg/backend';
import { OkResponse, extractOkResponse } from './response';
import { controllerIdentity } from './identity';
import { Identity } from '@dfinity/agent';
import { optional } from '@cg/nns-utils';

export class UsersOM {
  constructor(private readonly actor: Actor<BackendService>) {}

  /**
   * Creates a user profile and sets the role to reviewer using the {@link controllerIdentity} identity.
   */
  public async createReviewer(): Promise<
    [Identity, OkResponse<CreateMyUserProfileResponse>]
  > {
    const [identity, userProfile] = await this.createUser();
    await this.updateUser(userProfile.id, 'reviewer', {
      reviewer: {
        bio: [],
        wallet_address: [],
        neuron_id: [],
        social_links: [],
      },
    });
    const updatedProfile = await this.getUser(identity);

    return [identity, updatedProfile];
  }

  public async createAdmin(): Promise<
    [Identity, OkResponse<CreateMyUserProfileResponse>]
  > {
    const [identity, userProfile] = await this.createUser();
    await this.updateUser(userProfile.id, 'admin', {
      admin: {
        bio: [],
      },
    });
    const updatedProfile = await this.getUser(identity);

    return [identity, updatedProfile];
  }

  public async createAnonymous(): Promise<
    [Identity, OkResponse<CreateMyUserProfileResponse>]
  > {
    const [identity, userProfile] = await this.createUser();
    await this.updateUser(userProfile.id, 'anonymous');

    return [identity, userProfile];
  }

  private async createUser(): Promise<
    [Identity, OkResponse<CreateMyUserProfileResponse>]
  > {
    const identity = generateRandomIdentity();

    this.actor.setIdentity(identity);
    const createRes = await this.actor.create_my_user_profile();
    const createOkRes = extractOkResponse(createRes);

    return [identity, createOkRes];
  }

  private async getUser(
    identity: Identity,
  ): Promise<OkResponse<GetMyUserProfileResponse>> {
    this.actor.setIdentity(identity);
    const getRes = await this.actor.get_my_user_profile();
    return extractOkResponse(getRes);
  }

  private async updateUser(
    id: string,
    username: string,
    update?: UserConfigUpdate,
  ): Promise<void> {
    this.actor.setIdentity(controllerIdentity);
    const updateRes = await this.actor.update_user_profile({
      user_id: id,
      username: optional(username),
      config: optional(update),
    });
    extractOkResponse(updateRes);
  }
}
