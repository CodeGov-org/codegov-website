import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, map, switchMap } from 'rxjs';

import { GetProposalResponse, ProposalApiService } from '~core/api';
import { ProposalState } from '~core/api';
import { isNil } from '~core/utils';

const CACHE_TTL = 5_000;

@Injectable({
  providedIn: 'root',
})
export class ProposalService {
  private readonly proposalApiService = inject(ProposalApiService);

  private readonly currentProposalListSubject = new BehaviorSubject<
    GetProposalResponse[]
  >([]);
  public readonly currentProposalList$ =
    this.currentProposalListSubject.asObservable();

  private currentProposalIdSubject = new BehaviorSubject<string | null>(null);
  public readonly currentProposalId$ =
    this.currentProposalIdSubject.asObservable();

  private openProposalList: GetProposalResponse[] = [];
  private openProposalListLastLoaded: number | null = null;

  private closedProposalList: GetProposalResponse[] = [];
  private closedProposalListLastLoaded: number | null = null;

  private fullProposalList: GetProposalResponse[] = [];
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

  public async loadProposalList(state: ProposalState): Promise<void> {
    switch (state) {
      case ProposalState.InProgress:
        return await this.loadOpenProposals();
      case ProposalState.Completed:
        return await this.loadClosedProposals();
      default:
        return await this.loadAllProposals();
    }
  }

  public async setCurrentProposalId(proposalId: string): Promise<void> {
    this.currentProposalIdSubject.next(proposalId);
  }

  private async loadOpenProposals(): Promise<void> {
    if (this.isCached(this.openProposalListLastLoaded)) {
      this.currentProposalListSubject.next(this.openProposalList);
      return;
    }

    const getResponse = await this.proposalApiService.listOpenProposals();

    this.currentProposalListSubject.next(getResponse);
    this.openProposalList = this.currentProposalListSubject.getValue();
    this.openProposalListLastLoaded = Date.now();
  }

  private async loadClosedProposals(): Promise<void> {
    if (this.isCached(this.closedProposalListLastLoaded)) {
      this.currentProposalListSubject.next(this.closedProposalList);
      return;
    }

    const getResponse = await this.proposalApiService.listClosedProposals();

    this.currentProposalListSubject.next(getResponse);
    this.closedProposalList = this.currentProposalListSubject.getValue();
    this.closedProposalListLastLoaded = Date.now();
  }

  private async loadAllProposals(): Promise<void> {
    if (this.isCached(this.fullProposalListLastLoaded)) {
      this.currentProposalListSubject.next(this.fullProposalList);
      return;
    }

    const getResponse = await this.proposalApiService.listAllProposals();

    this.currentProposalListSubject.next(getResponse);
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
}
