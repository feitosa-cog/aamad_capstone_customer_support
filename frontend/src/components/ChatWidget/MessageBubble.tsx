import React from 'react';
import clsx from 'clsx';
import { formatDistanceToNow } from 'date-fns';

export interface MessageBubbleProps {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  confidence?: number;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  role,
  content,
  timestamp,
  confidence,
}) => {
  const isUser = role === 'user';
  const isSystem = role === 'system';

  return (
    <div
      className={clsx('flex mb-4 animate-slide-up', {
        'justify-end': isUser,
        'justify-start': !isUser,
      })}
    >
      <div
        className={clsx('max-w-xs lg:max-w-md px-4 py-2 rounded-lg', {
          'bg-blue-600 text-white rounded-br-none': isUser,
          'bg-gray-200 text-gray-900 rounded-bl-none': !isUser && !isSystem,
          'bg-amber-100 text-amber-900 border border-amber-300': isSystem,
        })}
      >
        <p className="text-sm break-words">{content}</p>
        <div
          className={clsx('text-xs mt-1', {
            'text-blue-200': isUser,
            'text-gray-500': !isUser && !isSystem,
            'text-amber-700': isSystem,
          })}
        >
          {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
          {confidence && !isUser && (
            <span className="ml-2">
              ({Math.round(confidence * 100)}% confidence)
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
