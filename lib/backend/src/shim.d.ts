import { type IDL } from '@dfinity/candid';
import { type ActorSubclass } from '@dfinity/agent';
import { type _SERVICE } from '../dist/backend.did.d.ts';

export declare const idlFactory: IDL.InterfaceFactory;

export declare type BackendApiActor = ActorSubclass<_SERVICE>;

export * from '../dist/backend.did.d.ts';
