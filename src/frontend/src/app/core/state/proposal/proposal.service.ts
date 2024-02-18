import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { BackendActorService } from '~core/services';
import { isOk } from '~core/utils';
import { mapOpenProposalListResponse } from './proposal.mapper';
import { Proposal } from './proposal.model';

@Injectable({
  providedIn: 'root',
})
export class ProposalService {
  private openProposalListSubject = new BehaviorSubject<Proposal[] | []>([]);
  public openProposalList$ = this.openProposalListSubject.asObservable();

  constructor(private readonly actorService: BackendActorService) {}

  public async loadOpenProposalList(): Promise<void> {
    const getResponse = await this.actorService.list_proposals();

    if (isOk(getResponse))
      this.openProposalListSubject.next(
        mapOpenProposalListResponse(getResponse.ok.proposals),
      );
    return;
  }
}
