
import React from 'react';
import { NotificationState, NotificationType } from '../types';
import { TESTNET_EXPLORER_URL } from '../constants';
import { CheckCircleIcon, ExclamationTriangleIcon, ExternalLinkIcon } from './Icon';

interface NotificationProps {
  notification: NotificationState;
  onDismiss: () => void;
}

const Notification: React.FC<NotificationProps> = ({ notification, onDismiss }) => {
  const isSuccess = notification.type === NotificationType.Success;
  const isError = notification.type === NotificationType.Error;

  const containerClasses = `w-full p-4 rounded-lg flex border ${
    isSuccess ? 'bg-green-50 border-green-200 text-green-800' : ''
  } ${
    isError ? 'bg-red-50 border-red-200 text-red-800' : ''
  }`;
  
  const Icon = isSuccess ? CheckCircleIcon : ExclamationTriangleIcon;

  return (
    <div className={containerClasses}>
      <div className="flex-shrink-0">
        <Icon className={`h-5 w-5 ${isSuccess ? 'text-green-500' : 'text-red-500'}`} />
      </div>
      <div className="ml-3 flex-1">
        <p className="text-sm">{notification.message}</p>
        {isSuccess && notification.hash && TESTNET_EXPLORER_URL && (
          <p className="mt-2 text-xs">
            <a
              href={`${TESTNET_EXPLORER_URL}/tx/${notification.hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center font-medium text-gray-800 hover:text-black underline"
            >
              View on Explorer
              <ExternalLinkIcon className="ml-1 h-3 w-3" />
            </a>
          </p>
        )}
      </div>
      <div className="ml-4 pl-3">
        <button
          onClick={onDismiss}
          className={`-mx-1.5 -my-1.5 p-1.5 rounded-lg inline-flex focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            isSuccess ? 'hover:bg-green-100 focus:ring-offset-green-50 focus:ring-green-500' : ''
          } ${
            isError ? 'hover:bg-red-100 focus:ring-offset-red-50 focus:ring-red-500' : ''
          }`}
        >
          <span className="sr-only">Dismiss</span>
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Notification;