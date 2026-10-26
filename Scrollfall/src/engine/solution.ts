import type { BotAction, TimeWindow } from './types';

export function tapWindow(action: BotAction | undefined): TimeWindow | undefined {
  return action?.type === 'tap' ? action.window : undefined;
}
