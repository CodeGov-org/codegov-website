import { Injectable, inject } from '@angular/core';

import { BackendActorService } from '../../services';
import { handleErr } from '../../utils';
import {
  mapCreateProposalReviewCommitRequest,
  mapDeleteProposalReviewCommitRequest,
  mapGetProposalReviewCommitResponse,
  mapUpdateProposalReviewCommitRequest,
} from './commit-review-api.mapper';
import {
  CreateProposalReviewCommitRequest,
  DeleteProposalReviewCommitRequest,
  GetProposalReviewCommitResponse,
  UpdateProposalReviewCommitRequest,
} from './commit-review-api.model';

@Injectable({
  providedIn: 'root',
})
export class CommitReviewApiService {
  private readonly actorService = inject(BackendActorService);

  public async createProposalCommitReview(
    req: CreateProposalReviewCommitRequest,
  ): Promise<GetProposalReviewCommitResponse> {
    const apiReq = mapCreateProposalReviewCommitRequest(req);

    const res = await this.actorService.create_proposal_review_commit(apiReq);
    const okRes = handleErr(res);

    return mapGetProposalReviewCommitResponse(okRes);
  }

  public async updateProposalReviewCommit(
    req: UpdateProposalReviewCommitRequest,
  ): Promise<null> {
    const apiReq = mapUpdateProposalReviewCommitRequest(req);

    const res = await this.actorService.update_proposal_review_commit(apiReq);
    const okRes = handleErr(res);

    return okRes;
  }

  public async deleteProposalReviewCommit(
    req: DeleteProposalReviewCommitRequest,
  ): Promise<null> {
    const apiReq = mapDeleteProposalReviewCommitRequest(req);

    const res = await this.actorService.delete_proposal_review_commit(apiReq);
    const okRes = handleErr(res);

    return okRes;
  }
}
