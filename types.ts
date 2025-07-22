
export enum NotificationType {
  Success = 'SUCCESS',
  Error = 'ERROR',
  Info = 'INFO',
}

export interface NotificationState {
  type: NotificationType;
  message: string;
  hash?: string;
}
