import { Injectable } from '@angular/core';
import { BehaviorSubject, map, switchMap } from 'rxjs';

import { ListProposalsResponse } from '@cg/backend';
import { BackendActorService } from '~core/services';
import { isOk } from '~core/utils';
import { mapOpenProposalListResponse } from './proposal.mapper';
import { Proposal } from './proposal.model';

@Injectable({
  providedIn: 'root',
})
export class ProposalService {
  private openProposalListSubject = new BehaviorSubject<Proposal[]>([]);
  public openProposalList$ = this.openProposalListSubject.asObservable();

  private currentProposalIdSubject = new BehaviorSubject<bigint | null>(null);
  public currentProposalId$ = this.currentProposalIdSubject.asObservable();

  private lastLoadTime: Date | undefined = undefined;

  public readonly currentProposal$ = this.currentProposalId$.pipe(
    switchMap(proposalId =>
      this.openProposalList$.pipe(
        map(
          proposals =>
            proposals.find(proposal => proposal.id === proposalId) ?? null,
        ),
      ),
    ),
  );

  constructor(private readonly actorService: BackendActorService) {}

  public async loadOpenProposalList(): Promise<void> {
    let getResponse: ListProposalsResponse;

    if (
      this.lastLoadTime === undefined ||
      new Date().getTime() - this.lastLoadTime?.getTime() > 5_000
    ) {
      getResponse = await this.actorService.list_proposals();
    } else return;

    if (isOk(getResponse)) {
      this.openProposalListSubject.next(
        mapOpenProposalListResponse(getResponse.ok.proposals),
      );
      this.lastLoadTime = new Date();
      return;
    }

    if (getResponse.err) {
      throw new Error(`${getResponse.err.code}: ${getResponse.err.message}`);
    }
  }

  public async setCurrentProposalId(proposalId: bigint): Promise<void> {
    this.currentProposalIdSubject.next(proposalId);
  }
}
