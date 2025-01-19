import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, map, switchMap } from 'rxjs';

import { GetProposalResponse, ProposalApiService } from '~core/api';
import { ProposalState } from '~core/api';

@Injectable({
  providedIn: 'root',
})
export class ProposalService {
  readonly #proposalApiService = inject(ProposalApiService);

  readonly #currentProposals = new BehaviorSubject<GetProposalResponse[]>([]);
  public readonly currentProposals$ = this.#currentProposals.asObservable();

  readonly #currentProposalId = new BehaviorSubject<string | null>(null);
  public readonly currentProposalId$ = this.#currentProposalId.asObservable();

  public readonly currentProposal$ = this.currentProposalId$.pipe(
    switchMap(proposalId =>
      this.currentProposals$.pipe(
        map(
          proposals =>
            proposals.find(proposal => proposal.id === proposalId) ?? null,
        ),
      ),
    ),
  );

  public async loadProposals(state: ProposalState): Promise<void> {
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
    this.#currentProposalId.next(proposalId);
  }

  private async loadOpenProposals(): Promise<void> {
    const getResponse = await this.#proposalApiService.listOpenProposals();

    this.#currentProposals.next(getResponse);
  }

  private async loadClosedProposals(): Promise<void> {
    const getResponse = await this.#proposalApiService.listClosedProposals();

    this.#currentProposals.next(getResponse);
  }

  private async loadAllProposals(): Promise<void> {
    const getResponse = await this.#proposalApiService.listAllProposals();

    this.#currentProposals.next(getResponse);
  }
}
