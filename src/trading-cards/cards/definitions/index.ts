export { pengoDefinition } from './pengo';
export { rosalindDefinition } from './rosalind';

import { pengoDefinition } from './pengo';
import { rosalindDefinition } from './rosalind';
import type { CardDefinition } from '../../arena/descriptorTypes';

export const allCardDefinitions: CardDefinition[] = [
  pengoDefinition,
  rosalindDefinition,
];
