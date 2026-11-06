import { ChitNotification } from '../types/chit';

// Fresh Clean Slate: 0 dummy notifications.
// Notifications are purely dynamic and generated only when real data entry happens
// (e.g. member payment, organizer approval/rejection, lucky draw winner)!
export const DEFAULT_NOTIFICATIONS: ChitNotification[] = [];
