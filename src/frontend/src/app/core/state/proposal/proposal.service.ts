import { Injectable } from '@angular/core';
import { BehaviorSubject, map, switchMap } from 'rxjs';

import { ListProposalsResponse, ReviewPeriodState } from '@cg/backend';
import { BackendActorService } from '~core/services';
import { isNil, isOk, optional } from '~core/utils';
import { mapProposalListResponse } from './proposal.mapper';
import { Proposal } from './proposal.model';

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
  private closedProposalList: Proposal[] = [];
  private fullProposalList: Proposal[] = [];

  private openProposalListLastLoaded: number | null = null;
  private closedProposalListLastLoaded: number | null = null;
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

  public async loadProposalList(state?: ReviewPeriodState): Promise<void> {
    if (state) {
      if ('in_progress' in state) {
        this.loadOpenProposals(state);
      } else if ('completed' in state) {
        this.loadClosedProposals(state);
      }
    } else if (state === undefined) {
      this.loadAllProposals();
    }
  }

  public async setCurrentProposalId(proposalId: bigint): Promise<void> {
    this.currentProposalIdSubject.next(proposalId);
  }

  private async loadOpenProposals(state: ReviewPeriodState): Promise<void> {
    if (this.isCached(this.openProposalListLastLoaded)) {
      this.currentProposalListSubject.next(this.openProposalList);
      return;
    } else {
      const getResponse = await this.actorService.list_proposals({
        state: optional(state),
      });
      this.handleResponse(getResponse);
      this.openProposalList = this.currentProposalListSubject.getValue();
      this.openProposalListLastLoaded = Date.now();
    }
  }

  private async loadClosedProposals(state: ReviewPeriodState): Promise<void> {
    if (this.isCached(this.closedProposalListLastLoaded)) {
      this.currentProposalListSubject.next(this.closedProposalList);
      return;
    } else {
      const getResponse = await this.actorService.list_proposals({
        state: optional(state),
      });
      this.handleResponse(getResponse);
      this.closedProposalList = this.currentProposalListSubject.getValue();
      this.closedProposalListLastLoaded = Date.now();
    }
  }

  private async loadAllProposals(): Promise<void> {
    if (this.isCached(this.fullProposalListLastLoaded)) {
      this.currentProposalListSubject.next(this.fullProposalList);
      return;
    } else {
      const getResponse = await this.actorService.list_proposals({
        state: [],
      });
      this.handleResponse(getResponse);
      this.fullProposalList = this.currentProposalListSubject.getValue();
      this.fullProposalListLastLoaded = Date.now();
    }
  }

  private isCached(lastLoadTime: number | null): boolean {
    if (isNil(lastLoadTime)) {
      return false;
    }

    const cacheExpiryTime = lastLoadTime + CACHE_TTL;
    const currentTime = Date.now();

    return currentTime > cacheExpiryTime;
  }

  private handleResponse(getResponse: ListProposalsResponse): void {
    if (isOk(getResponse)) {
      this.currentProposalListSubject.next(
        mapProposalListResponse(getResponse.ok.proposals),
      );
      return;
    }

    if (getResponse.err) {
      throw new Error(`${getResponse.err.code}: ${getResponse.err.message}`);
    }
  }

  // public async loadClosedProposalList(): Promise<void> {
  //   const closedProposalsList: ProposalResponse[] = [
  //     {
  //       id: '1234',
  //       proposal: {
  //         title: 'Test closed proposal',
  //         review_completed_at: ['2/17/2024, 1:01:25 AM'],
  //         state: { completed: null },
  //         synced_at: '2/17/2024, 1:01:25 AM',
  //         nervous_system: {
  //           network: {
  //             id: 12546n,
  //             topic: { replica_version_management: null },
  //           },
  //         },
  //         proposed_at: '2/14/2024, 1:01:25 AM',
  //         proposed_by: 5465465465n,
  //       },
  //     },
  //   ];
}
