import { UnloadHandler } from './mig-common.types';

export interface imageElementBase {
  element: HTMLElement;
  eventUnloadHandlers: UnloadHandler[];
}
