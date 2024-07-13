import {
  describe,
  beforeEach,
  beforeAll,
  afterAll,
  it,
  expect,
} from 'bun:test';
import { HttpResponse } from '@cg/backend';
import {
  verifyRequestResponsePair,
  Request,
} from '@dfinity/response-verification';
import {
  CERTIFICATE_VERSION,
  Governance,
  TestDriver,
  VALID_IMAGE_BYTES,
  createProposalReviewWithImage,
  extractOkResponse,
  filterCertificateHeaders,
  mapFromCanisterResponse,
  mapToCanisterRequest,
} from '../support';
import { CODEGOV_LOGO_PNG } from '../fixtures';

const NS_PER_MS = 1e6;

describe('http proposal review image', () => {
  let driver: TestDriver;

  let rootKey: ArrayBufferLike;

  let governance: Governance;

  beforeAll(async () => {
    driver = await TestDriver.createWithNnsState();

    governance = new Governance(driver.pic);

    rootKey = await driver.getRootKey();
  });

  beforeEach(async () => {
    await driver.resetBackendCanister();
  });

  afterAll(async () => {
    await driver.tearDown();
  });

  const maxCertTimeOffsetNs = BigInt(5 * 60 * 1000) * BigInt(NS_PER_MS); // 5 minutes

  async function verifyHttpResponse(
    request: Request,
    canisterResponse: HttpResponse,
  ): Promise<void> {
    const currentDate = await driver.getCurrentDate();
    const currentTimeNs = BigInt(currentDate.getTime()) * BigInt(NS_PER_MS);

    const response = mapFromCanisterResponse(canisterResponse);
    const verificationResult = verifyRequestResponsePair(
      request,
      response,
      driver.canisterId.toUint8Array(),
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
  }

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
    const [reviewer] = await driver.users.createReviewer();

    const { imagePath } = await createProposalReviewWithImage(
      driver.actor,
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

    const canisterResponse = await driver.actor.http_request(canisterRequest);
    verifyImageHttpResponse(request, canisterResponse, CODEGOV_LOGO_PNG);
  });

  it('should return the proposal review image with certificate after update', async () => {
    const [reviewer] = await driver.users.createReviewer();

    const { proposalId, imagePath } = await createProposalReviewWithImage(
      driver.actor,
      governance,
      reviewer,
      CODEGOV_LOGO_PNG,
    );

    driver.actor.setIdentity(reviewer);
    const resDelete = await driver.actor.delete_proposal_review_image({
      proposal_id: proposalId,
      image_path: imagePath,
    });
    extractOkResponse(resDelete);

    const resCreate = await driver.actor.create_proposal_review_image({
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

    const canisterResponse = await driver.actor.http_request(canisterRequest);
    verifyImageHttpResponse(request, canisterResponse, VALID_IMAGE_BYTES);
  });

  it('should return 404 when proposal review image is deleted', async () => {
    const [reviewer] = await driver.users.createReviewer();

    const { proposalId, imagePath } = await createProposalReviewWithImage(
      driver.actor,
      governance,
      reviewer,
      CODEGOV_LOGO_PNG,
    );

    driver.actor.setIdentity(reviewer);
    const resDelete = await driver.actor.delete_proposal_review_image({
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

    const canisterResponse = await driver.actor.http_request(canisterRequest);
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

    const canisterResponse = await driver.actor.http_request(canisterRequest);
    expect(canisterResponse.status_code).toBe(404);

    verifyHttpResponse(request, canisterResponse);
  });

  it('should return 405 when requesting image with invalid method', async () => {
    const [reviewer] = await driver.users.createReviewer();

    const { imagePath } = await createProposalReviewWithImage(
      driver.actor,
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

    const canisterResponse = await driver.actor.http_request(canisterRequest);
    expect(canisterResponse.status_code).toBe(405);

    verifyHttpResponse(request, canisterResponse);
  });
});
