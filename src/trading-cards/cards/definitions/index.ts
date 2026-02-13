export { pengoDefinition } from './pengo';
export { rosalindDefinition } from './rosalind';
export { evilPengoDefinition } from './evil-pengo';
export { speepoDefinition } from './speepo';

import { pengoDefinition } from './pengo';
import { rosalindDefinition } from './rosalind';
import { evilPengoDefinition } from './evil-pengo';
import { speepoDefinition } from './speepo';
import type { CardDefinition } from '../../arena/descriptorTypes';

export const allCardDefinitions: CardDefinition[] = [
  pengoDefinition,
  rosalindDefinition,
  evilPengoDefinition,
  speepoDefinition,
];
