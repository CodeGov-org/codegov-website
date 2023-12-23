import { type FC, type PropsWithChildren } from 'react';

export type Component<T = unknown> = FC<PropsWithChildren<T>>;
