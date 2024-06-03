import {
  describe,
  beforeEach,
  beforeAll,
  afterAll,
  it,
  expect,
} from 'bun:test';
import { resolve } from 'path';
import { HttpResponse, type _SERVICE } from '@cg/backend';
import {
  PocketIc,
  type Actor,
  generateRandomIdentity,
  SubnetStateType,
} from '@hadronous/pic';
import { Principal } from '@dfinity/principal';
import {
  verifyRequestResponsePair,
  Request,
} from '@dfinity/response-verification';
import {
  CERTIFICATE_VERSION,
  Governance,
  VALID_IMAGE_BYTES,
  createProposalReviewWithImage,
  createReviewer,
  extractOkResponse,
  filterCertificateHeaders,
  mapFromCanisterResponse,
  mapToCanisterRequest,
  resetBackendCanister,
  setupBackendCanister,
} from '../support';
import { CODEGOV_LOGO_PNG } from '../fixtures';

const NNS_SUBNET_ID =
  '2o3zy-oo4hc-r3mtq-ylrpf-g6qge-qmuzn-2bsuv-d3yhd-e4qjc-6ff2b-6ae';

const NNS_STATE_PATH = resolve(
  __dirname,
  '..',
  '..',
  'state',
  'proposal_reviews_nns_state',
  'node-100',
  'state',
);

const NS_PER_MS = 1e6;

describe('http proposal review image', () => {
  let actor: Actor<_SERVICE>;
  let pic: PocketIc;
  let canisterId: Principal;

  let rootKey: ArrayBufferLike;

  // set to any date after the NNS state has been generated
  const initialDate = new Date(2024, 3, 25, 0, 0, 0, 0);

  let governance: Governance;

  beforeAll(async () => {
    pic = await PocketIc.create(process.env.PIC_URL, {
      processingTimeoutMs: 10_000,
      nns: {
        state: {
          type: SubnetStateType.FromPath,
          path: NNS_STATE_PATH,
          subnetId: Principal.fromText(NNS_SUBNET_ID),
        },
      },
    });
    await pic.setTime(initialDate.getTime());

    const fixture = await setupBackendCanister(pic);
    actor = fixture.actor;
    canisterId = fixture.canisterId;
    governance = new Governance(pic);

    const nnsSubnet = pic.getNnsSubnet()!;
    rootKey = await pic.getPubKey(nnsSubnet.id);
  });

  beforeEach(async () => {
    await resetBackendCanister(pic, canisterId);
  });

  afterAll(async () => {
    await pic.tearDown();
  });

  const maxCertTimeOffsetNs = BigInt(5 * 60 * 1000) * BigInt(NS_PER_MS); // 5 minutes
  const currentTimeNs = BigInt(initialDate.getTime()) * BigInt(NS_PER_MS);

  const verifyHttpResponse = (
    request: Request,
    canisterResponse: HttpResponse,
  ) => {
    const response = mapFromCanisterResponse(canisterResponse);
    const verificationResult = verifyRequestResponsePair(
      request,
      response,
      canisterId.toUint8Array(),
      currentTimeNs,
      maxCertTimeOffsetNs,
      new Uint8Array(rootKey),
      CERTIFICATE_VERSION,
    );

    expect(verificationResult.verificationVersion).toEqual(CERTIFICATE_VERSION);
    expect(verificationResult.response).toEqual(
      filterCertificateHeaders(response),
    );
    expect(verificationResult.response?.body).toEqual(response.body);
  };

  const verifyImageHttpResponse = (
    request: Request,
    canisterResponse: HttpResponse,
    imageBytes: Uint8Array,
  ) => {
    const response = mapFromCanisterResponse(canisterResponse);
    expect(response.statusCode).toBe(200);
    expect(
      response.headers.find(h => h[0].toLowerCase() === 'content-type')![1],
    ).toEqual('image/png');
    expect(
      response.headers.find(h => h[0].toLowerCase() === 'content-length')![1],
    ).toEqual(imageBytes.byteLength.toString());
    expect(response.body).toEqual(imageBytes);

    verifyHttpResponse(request, canisterResponse);
  };

  it('should return the proposal review image with certificate', async () => {
    const reviewer = generateRandomIdentity();
    await createReviewer(actor, reviewer);

    const { imagePath } = await createProposalReviewWithImage(
      actor,
      governance,
      reviewer,
      CODEGOV_LOGO_PNG,
    );

    const request: Request = {
      url: imagePath,
      method: 'GET',
      headers: [],
      body: new Uint8Array(),
    };
    const canisterRequest = mapToCanisterRequest(request);

    const canisterResponse = await actor.http_request(canisterRequest);
    verifyImageHttpResponse(request, canisterResponse, CODEGOV_LOGO_PNG);
  });

  it('should return the proposal review image with certificate after update', async () => {
    const reviewer = generateRandomIdentity();
    await createReviewer(actor, reviewer);

    const { proposalId, imagePath } = await createProposalReviewWithImage(
      actor,
      governance,
      reviewer,
      CODEGOV_LOGO_PNG,
    );

    actor.setIdentity(reviewer);
    const resDelete = await actor.delete_proposal_review_image({
      proposal_id: proposalId,
      image_path: imagePath,
    });
    extractOkResponse(resDelete);

    const resCreate = await actor.create_proposal_review_image({
      proposal_id: proposalId,
      content_type: 'image/png',
      content_bytes: VALID_IMAGE_BYTES,
    });
    const resCreateOk = extractOkResponse(resCreate);

    const imagePathUpdated = resCreateOk.path;

    const request: Request = {
      url: imagePathUpdated,
      method: 'GET',
      headers: [],
      body: new Uint8Array(),
    };
    const canisterRequest = mapToCanisterRequest(request);

    const canisterResponse = await actor.http_request(canisterRequest);
    verifyImageHttpResponse(request, canisterResponse, VALID_IMAGE_BYTES);
  });

  it('should return 404 when proposal review image is deleted', async () => {
    const reviewer = generateRandomIdentity();
    await createReviewer(actor, reviewer);

    const { proposalId, imagePath } = await createProposalReviewWithImage(
      actor,
      governance,
      reviewer,
      CODEGOV_LOGO_PNG,
    );

    actor.setIdentity(reviewer);
    const resDelete = await actor.delete_proposal_review_image({
      proposal_id: proposalId,
      image_path: imagePath,
    });
    extractOkResponse(resDelete);

    const request: Request = {
      url: imagePath,
      method: 'GET',
      headers: [],
      body: new Uint8Array(),
    };
    const canisterRequest = mapToCanisterRequest(request);

    const canisterResponse = await actor.http_request(canisterRequest);
    expect(canisterResponse.status_code).toBe(404);

    verifyHttpResponse(request, canisterResponse);
  });

  it('should return 404 when image does not exist', async () => {
    const nonExistentImageId = 'f8cbe268-fb3d-48e5-8d6b-3d0262c644b4';

    const request: Request = {
      url: `/images/reviews/${nonExistentImageId}`,
      method: 'GET',
      headers: [],
      body: new Uint8Array(),
    };
    const canisterRequest = mapToCanisterRequest(request);

    const canisterResponse = await actor.http_request(canisterRequest);
    expect(canisterResponse.status_code).toBe(404);

    verifyHttpResponse(request, canisterResponse);
  });

  it('should return 405 when requesting image with invalid method', async () => {
    const reviewer = generateRandomIdentity();
    await createReviewer(actor, reviewer);

    const { imagePath } = await createProposalReviewWithImage(
      actor,
      governance,
      reviewer,
      CODEGOV_LOGO_PNG,
    );

    const request: Request = {
      url: imagePath,
      method: 'POST',
      headers: [],
      body: new Uint8Array(),
    };
    const canisterRequest = mapToCanisterRequest(request);

    const canisterResponse = await actor.http_request(canisterRequest);
    expect(canisterResponse.status_code).toBe(405);

    verifyHttpResponse(request, canisterResponse);
  });
});
