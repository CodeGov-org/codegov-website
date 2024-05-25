// import { backendActorServiceMockFactory } from '../../services/backend-actor-service-mock';
// import { ProposalReviewWithId } from '@cg/backend';
// import { mapReviewSubmissionResponse } from './review-submission.mapper';
// import { ReviewSubmissionService } from './review-submission.service';

// describe('ReviewSubmissionService', () => {
//   let service: ReviewSubmissionService;

//   const backendActorServiceMock = backendActorServiceMockFactory();

//   const id = '1';
//   const proposalId = 'e4e6247e-fda4-4678-8590-2cf86b876c92';
//   const userId = 'a36bc00d-3ead-4dd1-9115-6b68fce1783c';
//   const commitSha = '96f4ab3090ad72964319346967f4ce9634df200e';

//   beforeEach(() => {
//     service = new ReviewSubmissionService(backendActorServiceMock);
//   });

//   it('should be created', () => {
//     expect(service).toBeTruthy();
//   });

//   describe('loadOrCreateReview()', () => {
//     it('should load and emit the review if it exists', async () => {
//       const reviewSpy = jasmine.createSpy();
//       service.review$.subscribe(reviewSpy);

//       const commitsSpy = jasmine.createSpy();
//       service.commits$.subscribe(commitsSpy);

//       const proposalReviewResponse = createProposalReviewResponse({
//         proposalId,
//         userId,
//       });
//       backendActorServiceMock.get_my_proposal_review.and.resolveTo({
//         ok: proposalReviewResponse,
//       });

//       service.setCurrentProposal(proposalId);
//       await service.loadOrCreateReview();

//       expect(reviewSpy).toHaveBeenCalledTimes(2);
//       expect(reviewSpy).toHaveBeenCalledWith(null);
//       expect(reviewSpy).toHaveBeenCalledWith(
//         mapReviewSubmissionResponse(proposalReviewResponse),
//       );

//       expect(commitsSpy).toHaveBeenCalledTimes(2);
//       expect(commitsSpy).toHaveBeenCalledWith(null);
//       expect(commitsSpy).toHaveBeenCalledWith([]);
//     });

//     it('should create and emit the review if it does not exist', async () => {
//       const reviewSpy = jasmine.createSpy();
//       service.review$.subscribe(reviewSpy);

//       const commitsSpy = jasmine.createSpy();
//       service.commits$.subscribe(commitsSpy);

//       backendActorServiceMock.get_my_proposal_review.and.resolveTo({
//         err: {
//           code: 404,
//           message: 'Not found',
//         },
//       });

//       const proposalReviewResponse = createProposalReviewResponse({
//         proposalId,
//         userId,
//       });
//       backendActorServiceMock.create_proposal_review.and.resolveTo({
//         ok: proposalReviewResponse,
//       });

//       service.setCurrentProposal(proposalId);
//       await service.loadOrCreateReview();

//       expect(reviewSpy).toHaveBeenCalledTimes(2);
//       expect(reviewSpy).toHaveBeenCalledWith(null);
//       expect(reviewSpy).toHaveBeenCalledWith(
//         mapReviewSubmissionResponse(proposalReviewResponse),
//       );

//       expect(commitsSpy).toHaveBeenCalledTimes(2);
//       expect(commitsSpy).toHaveBeenCalledWith(null);
//       expect(commitsSpy).toHaveBeenCalledWith([]);
//     });

//     it('should not emit again if a cached review exists', async () => {
//       const reviewSpy = jasmine.createSpy();
//       service.review$.subscribe(reviewSpy);

//       const commitsSpy = jasmine.createSpy();
//       service.commits$.subscribe(commitsSpy);

//       const proposalReviewResponse = createProposalReviewResponse({
//         proposalId,
//         userId,
//       });
//       backendActorServiceMock.get_my_proposal_review.and.resolveTo({
//         ok: proposalReviewResponse,
//       });

//       service.setCurrentProposal(proposalId);
//       await service.loadOrCreateReview();
//       await service.loadOrCreateReview();

//       expect(reviewSpy).toHaveBeenCalledTimes(2);
//       expect(reviewSpy).toHaveBeenCalledWith(null);
//       expect(reviewSpy).toHaveBeenCalledWith(
//         mapReviewSubmissionResponse(proposalReviewResponse),
//       );

//       expect(commitsSpy).toHaveBeenCalledTimes(2);
//       expect(commitsSpy).toHaveBeenCalledWith(null);
//       expect(commitsSpy).toHaveBeenCalledWith([]);
//     });

//     it('should throw an error if fetching the review fails', async () => {
//       backendActorServiceMock.get_my_proposal_review.and.resolveTo({
//         err: {
//           code: 500,
//           message: 'Internal server error',
//         },
//       });

//       service.setCurrentProposal(proposalId);
//       await expectAsync(service.loadOrCreateReview()).toBeRejectedWith(
//         new Error('500: Internal server error'),
//       );
//     });

//     it('should throw an error if creating the review fails', async () => {
//       backendActorServiceMock.get_my_proposal_review.and.resolveTo({
//         err: {
//           code: 404,
//           message: 'Not found',
//         },
//       });

//       backendActorServiceMock.create_proposal_review.and.resolveTo({
//         err: {
//           code: 500,
//           message: 'Internal server error',
//         },
//       });

//       service.setCurrentProposal(proposalId);
//       await expectAsync(service.loadOrCreateReview()).toBeRejectedWith(
//         new Error('500: Internal server error'),
//       );
//     });
//   });

//   describe('addCommit()', () => {
//     it('should add a commit to the review', async () => {
//       const commitsSpy = jasmine.createSpy();
//       service.commits$.subscribe(commitsSpy);

//       const proposalReviewResponse = createProposalReviewResponse({
//         proposalId,
//         userId,
//       });
//       backendActorServiceMock.get_my_proposal_review.and.resolveTo({
//         ok: proposalReviewResponse,
//       });

//       service.setCurrentProposal(proposalId);
//       await service.loadOrCreateReview();
//       service.addCommit();

//       expect(commitsSpy).toHaveBeenCalledTimes(3);
//       expect(commitsSpy).toHaveBeenCalledWith(null);
//       expect(commitsSpy).toHaveBeenCalledWith([]);
//       expect(commitsSpy).toHaveBeenCalledWith([
//         {
//           commitSha: null,
//           details: {
//             reviewed: null,
//           },
//         },
//       ]);
//     });

//     it('should throw an error if the proposal review already has an empty commit', async () => {
//       const proposalReviewResponse = createProposalReviewResponse({
//         proposalId,
//         userId,
//       });
//       backendActorServiceMock.get_my_proposal_review.and.resolveTo({
//         ok: proposalReviewResponse,
//       });

//       service.setCurrentProposal(proposalId);
//       await service.loadOrCreateReview();
//       service.addCommit();

//       expect(() => service.addCommit()).toThrowError(
//         `An existing empty commit for proposal with Id ${proposalId} already exists`,
//       );
//     });

//     it('should throw an error if the proposal review does not exist', async () => {
//       service.setCurrentProposal(proposalId);
//       expect(() => service.addCommit()).toThrowError(
//         `Tried to add a commit for proposal with Id ${proposalId} but it does not exist`,
//       );
//     });
//   });

//   describe('removeCommit()', () => {
//     it('should delete a commit from the review', async () => {
//       const commitsSpy = jasmine.createSpy();
//       service.commits$.subscribe(commitsSpy);

//       const proposalReviewResponse = createProposalReviewResponse({
//         proposalId,
//         userId,
//       });
//       backendActorServiceMock.get_my_proposal_review.and.resolveTo({
//         ok: proposalReviewResponse,
//       });

//       service.setCurrentProposal(proposalId);
//       await service.loadOrCreateReview();
//       service.addCommit();
//       service.removeCommit(null);

//       expect(commitsSpy).toHaveBeenCalledTimes(4);
//       expect(commitsSpy).toHaveBeenCalledWith(null);
//       expect(commitsSpy).toHaveBeenCalledWith([]);
//       expect(commitsSpy).toHaveBeenCalledWith([
//         {
//           commitSha: null,
//           details: {
//             reviewed: null,
//           },
//         },
//       ]);
//       expect(commitsSpy).toHaveBeenCalledWith([]);
//     });

//     it('should throw an error if the proposal review does not exist', async () => {
//       service.setCurrentProposal(proposalId);
//       expect(() => service.removeCommit(commitSha)).toThrowError(
//         `Tried to remove a commit for proposal with Id ${proposalId} but it does not exist`,
//       );
//     });

//     it('should throw an error if the commit does not exist', async () => {
//       const proposalReviewResponse = createProposalReviewResponse({
//         proposalId,
//         userId,
//       });
//       backendActorServiceMock.get_my_proposal_review.and.resolveTo({
//         ok: proposalReviewResponse,
//       });

//       service.setCurrentProposal(proposalId);
//       await service.loadOrCreateReview();

//       expect(() => service.removeCommit(commitSha)).toThrowError(
//         `Tried to remove a commit with SHA ${commitSha} from proposal with Id ${proposalId} but it does not exist`,
//       );
//     });
//   });

//   describe('updateCommit()', () => {
//     it('should update a commit in the review', async () => {
//       const commitsSpy = jasmine.createSpy();
//       service.commits$.subscribe(commitsSpy);

//       const proposalReviewResponse = createProposalReviewResponse({
//         proposalId,
//         userId,
//       });
//       backendActorServiceMock.get_my_proposal_review.and.resolveTo({
//         ok: proposalReviewResponse,
//       });

//       service.setCurrentProposal(proposalId);
//       await service.loadOrCreateReview();
//       service.addCommit();
//       service.updateCommit(null, {
//         id,
//         commitSha,
//         details: {
//           reviewed: false,
//         },
//       });

//       expect(commitsSpy).toHaveBeenCalledTimes(4);
//       expect(commitsSpy).toHaveBeenCalledWith(null);
//       expect(commitsSpy).toHaveBeenCalledWith([]);
//       expect(commitsSpy).toHaveBeenCalledWith([
//         {
//           commitSha: null,
//           details: {
//             reviewed: null,
//           },
//         },
//       ]);
//       expect(commitsSpy).toHaveBeenCalledWith([
//         {
//           commitSha,
//           details: {
//             reviewed: false,
//           },
//         },
//       ]);
//     });

//     it('should throw an error if the proposal review does not exist', async () => {
//       service.setCurrentProposal(proposalId);
//       expect(() =>
//         service.updateCommit(commitSha, {
//           id,
//           commitSha,
//           details: {
//             reviewed: false,
//           },
//         }),
//       ).toThrowError(
//         `Tried to update a commit for proposal with Id ${proposalId} but it does not exist`,
//       );
//     });

//     it('should throw an error if the commit does not exist', async () => {
//       const proposalReviewResponse = createProposalReviewResponse({
//         proposalId,
//         userId,
//       });
//       backendActorServiceMock.get_my_proposal_review.and.resolveTo({
//         ok: proposalReviewResponse,
//       });

//       service.setCurrentProposal(proposalId);
//       await service.loadOrCreateReview();

//       expect(() =>
//         service.updateCommit(commitSha, {
//           id,
//           commitSha,
//           details: {
//             reviewed: false,
//           },
//         }),
//       ).toThrowError(
//         `Tried to update a commit with SHA ${commitSha} from proposal with Id ${proposalId} but it does not exist`,
//       );
//     });
//   });
// });

// interface CreateGetMyProposalReviewResponseOpts {
//   proposalId: string;
//   userId: string;
// }

// function createProposalReviewResponse({
//   proposalId,
//   userId,
// }: CreateGetMyProposalReviewResponseOpts): ProposalReviewWithId {
//   return {
//     id: proposalId,
//     proposal_review: {
//       proposal_id: proposalId,
//       user_id: userId,
//       build_reproduced: [],
//       created_at: '2021-09-01T00:00:00Z',
//       proposal_review_commits: [],
//       last_updated_at: [],
//       reproduced_build_image_id: [],
//       review_duration_mins: [0],
//       status: { draft: null },
//       summary: [''],
//     },
//   };
// }
