import { Injectable } from '@angular/core';
import { BehaviorSubject, map, switchMap } from 'rxjs';

import { ListProposalsResponse, ProposalResponse } from '@cg/backend';
import { BackendActorService } from '~core/services';
import { isNil, isOk } from '~core/utils';
import {
  mapClosedProposalListResponse,
  mapOpenProposalListResponse,
} from './proposal.mapper';
import { Proposal } from './proposal.model';

const CACHE_TTL = 5_000;

@Injectable({
  providedIn: 'root',
})
export class ProposalService {
  private openProposalListSubject = new BehaviorSubject<Proposal[]>([]);
  public openProposalList$ = this.openProposalListSubject.asObservable();

  private closedProposalListSubject = new BehaviorSubject<Proposal[]>([]);
  public closedProposalList$ = this.closedProposalListSubject.asObservable();

  private currentProposalIdSubject = new BehaviorSubject<bigint | null>(null);
  public currentProposalId$ = this.currentProposalIdSubject.asObservable();

  private lastLoadTime: number | null = null;

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

    if (!this.isCached()) {
      getResponse = await this.actorService.list_proposals();
    } else return;

    if (isOk(getResponse)) {
      this.openProposalListSubject.next(
        mapOpenProposalListResponse(getResponse.ok.proposals),
      );
      this.lastLoadTime = Date.now();
      return;
    }

    if (getResponse.err) {
      throw new Error(`${getResponse.err.code}: ${getResponse.err.message}`);
    }
  }

  public async setCurrentProposalId(proposalId: bigint): Promise<void> {
    this.currentProposalIdSubject.next(proposalId);
  }

  private isCached(): boolean {
    if (isNil(this.lastLoadTime)) {
      return false;
    }

    const cacheExpiryTime = this.lastLoadTime + CACHE_TTL;
    const currentTime = Date.now();

    return currentTime > cacheExpiryTime;
  }

  public async loadClosedProposalList(): Promise<void> {
    const closedProposalsPlaceholder: ProposalResponse[] = [
      {
        id: '1234',
        proposal: {
          title: 'Test closed proposal',
          review_completed_at: ['2/17/2024, 1:01:25 AM'],
          state: { completed: null },
          synced_at: '2/17/2024, 1:01:25 AM',
          nervous_system: {
            network: {
              id: 12546n,
              topic: { replica_version_management: null },
            },
          },
          proposed_at: '2/14/2024, 1:01:25 AM',
          proposed_by: 5465465465n,
        },
      },
    ];

    this.closedProposalListSubject.next(
      mapClosedProposalListResponse(closedProposalsPlaceholder),
    );
  }
}
