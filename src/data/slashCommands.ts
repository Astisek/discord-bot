import { availableCommands } from '@data/availableCommands';

export const slashCommands = availableCommands.map(({ builder }) => ({
  builder,
}));
