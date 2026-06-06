import React from 'react';
import clsx from 'clsx';
import { formatDistanceToNow } from 'date-fns';

export interface MessageBubbleProps {
  role: 'user' | 'assistant' | 'system' | 'real_agent';
  senderType?: 'requestor' | 'ai_agent' | 'real_agent' | 'system';
  content: string;
  timestamp: string;
  confidence?: number;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  role,
  senderType,
  content,
  timestamp,
  confidence,
}) => {
  const effectiveSenderType = senderType || (role === 'user' ? 'requestor' : role === 'real_agent' ? 'real_agent' : role === 'assistant' ? 'ai_agent' : 'system');
  const isUser = effectiveSenderType === 'requestor';
  const isRealAgent = effectiveSenderType === 'real_agent';
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
          'bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-bl-none': isRealAgent,
          'bg-gray-200 text-gray-900 rounded-bl-none': !isUser && !isSystem && !isRealAgent,
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
          {isRealAgent && <span className="ml-2 font-medium">(real agent)</span>}
          {confidence && !isUser && !isRealAgent && (
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
