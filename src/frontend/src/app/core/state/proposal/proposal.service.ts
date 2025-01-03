import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, map, switchMap } from 'rxjs';

import { GetProposalResponse, ProposalApiService } from '~core/api';
import { ProposalState } from '~core/api';

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
    const getResponse = await this.proposalApiService.listOpenProposals();

    this.currentProposalListSubject.next(getResponse);
  }

  private async loadClosedProposals(): Promise<void> {
    const getResponse = await this.proposalApiService.listClosedProposals();

    this.currentProposalListSubject.next(getResponse);
  }

  private async loadAllProposals(): Promise<void> {
    const getResponse = await this.proposalApiService.listAllProposals();

    this.currentProposalListSubject.next(getResponse);
  }
}
