import { AnonymousIdentity } from '@dfinity/agent';
import { createIdentity } from '@hadronous/pic';

export const anonymousIdentity = new AnonymousIdentity();
export const controllerIdentity = createIdentity('@Password!1234');
export const nnsProposerIdentity = createIdentity('@Password!5678');
