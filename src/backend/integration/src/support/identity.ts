import { AnonymousIdentity } from '@dfinity/agent';
import { createIdentity } from '@hadronous/pic';

export const anonymousIdentity = new AnonymousIdentity();
export const defaultIdentity = createIdentity('@Password!1234');
