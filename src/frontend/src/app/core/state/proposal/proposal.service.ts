import { Injectable } from '@angular/core';
import { BehaviorSubject, map, switchMap } from 'rxjs';

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
    const getResponse = await this.actorService.list_proposals();

    if (isOk(getResponse)) {
      this.openProposalListSubject.next(
        mapOpenProposalListResponse(getResponse.ok.proposals),
      );
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
