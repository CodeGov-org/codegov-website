import { Injectable } from '@angular/core';
import { BehaviorSubject, map, switchMap } from 'rxjs';

import { ListProposalsResponse } from '@cg/backend';
import { BackendActorService } from '~core/services';
import { extractOkResponse, isNil, optional } from '~core/utils';
import { mapProposalListResponse } from './proposal.mapper';
import { Proposal, ProposalState } from './proposal.model';

const CACHE_TTL = 5_000;

@Injectable({
  providedIn: 'root',
})
export class ProposalService {
  private currentProposalListSubject = new BehaviorSubject<Proposal[]>([]);
  public currentProposalList$ = this.currentProposalListSubject.asObservable();

  private currentProposalIdSubject = new BehaviorSubject<bigint | null>(null);
  public currentProposalId$ = this.currentProposalIdSubject.asObservable();

  private openProposalList: Proposal[] = [];
  private openProposalListLastLoaded: number | null = null;

  private closedProposalList: Proposal[] = [];
  private closedProposalListLastLoaded: number | null = null;

  private fullProposalList: Proposal[] = [];
  private fullProposalListLastLoaded: number | null = null;

  public readonly currentProposal$ = this.currentProposalId$.pipe(
    switchMap(proposalId =>
      this.currentProposalList$.pipe(
        map(
          proposals =>
            proposals.find(proposal => proposal.id === proposalId) ?? null,
        ),
      ),
    ),
  );

  constructor(private readonly actorService: BackendActorService) {}

  public async loadProposalList(state?: ProposalState): Promise<void> {
    if (isNil(state)) {
      return await this.loadAllProposals();
    }

    if (state === ProposalState.InProgress) {
      return await this.loadOpenProposals();
    }

    if (state === ProposalState.Completed) {
      return await this.loadClosedProposals();
    }
  }

  public async setCurrentProposalId(proposalId: bigint): Promise<void> {
    this.currentProposalIdSubject.next(proposalId);
  }

  private async loadOpenProposals(): Promise<void> {
    if (this.isCached(this.openProposalListLastLoaded)) {
      this.currentProposalListSubject.next(this.openProposalList);
      return;
    }

    const getResponse = await this.actorService.list_proposals({
      state: optional({ in_progress: null }),
    });
    this.currentProposalListSubject.next(this.getProposalList(getResponse));
    this.openProposalList = this.currentProposalListSubject.getValue();
    this.openProposalListLastLoaded = Date.now();
  }

  private async loadClosedProposals(): Promise<void> {
    console.log('load closed');
    if (this.isCached(this.closedProposalListLastLoaded)) {
      this.currentProposalListSubject.next(this.closedProposalList);
      return;
    }
    const getResponse = await this.actorService.list_proposals({
      state: optional({ completed: null }),
    });
    this.currentProposalListSubject.next(this.getProposalList(getResponse));
    this.closedProposalList = this.currentProposalListSubject.getValue();
    this.closedProposalListLastLoaded = Date.now();
  }

  private async loadAllProposals(): Promise<void> {
    if (this.isCached(this.fullProposalListLastLoaded)) {
      this.currentProposalListSubject.next(this.fullProposalList);
      return;
    }

    const getResponse = await this.actorService.list_proposals({
      state: [],
    });
    this.currentProposalListSubject.next(this.getProposalList(getResponse));
    this.fullProposalList = this.currentProposalListSubject.getValue();
    this.fullProposalListLastLoaded = Date.now();
  }

  private isCached(lastLoadTime: number | null): boolean {
    if (isNil(lastLoadTime)) {
      return false;
    }

    const cacheExpiryTime = lastLoadTime + CACHE_TTL;
    const currentTime = Date.now();

    return currentTime > cacheExpiryTime;
  }

  private getProposalList(getResponse: ListProposalsResponse): Proposal[] {
    return mapProposalListResponse(extractOkResponse(getResponse).proposals);
  }
}
