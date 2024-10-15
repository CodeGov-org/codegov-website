import { inject, Injectable } from '@angular/core';

import { BackendActorService } from '~core/services';
import { handleErr } from '~core/utils';
import {
  mapGetProposalResponse,
  mapListProposalsRequest,
} from './proposal-api.mapper';
import {
  GetProposalResponse,
  ListProposalsRequest,
  ProposalState,
} from './proposal-api.model';

@Injectable({
  providedIn: 'root',
})
export class ProposalApiService {
  private readonly actorService = inject(BackendActorService);

  public async listOpenProposals(): Promise<GetProposalResponse[]> {
    return await this.listProposals({ state: ProposalState.InProgress });
  }

  public async listClosedProposals(): Promise<GetProposalResponse[]> {
    return await this.listProposals({ state: ProposalState.Completed });
  }

  public async listAllProposals(): Promise<GetProposalResponse[]> {
    return await this.listProposals({ state: ProposalState.Any });
  }

  private async listProposals(
    req: ListProposalsRequest,
  ): Promise<GetProposalResponse[]> {
    const apiReq = mapListProposalsRequest(req);

    const res = await this.actorService.list_proposals(apiReq);
    const okRes = handleErr(res);

    return okRes.proposals.map(mapGetProposalResponse);
  }
}
