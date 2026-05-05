import React, { useState } from 'react';
import { Send } from 'lucide-react';
import clsx from 'clsx';

export interface InputBoxProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  placeholder?: string;
}

export const InputBox: React.FC<InputBoxProps> = ({
  onSend,
  isLoading,
  placeholder = 'Type your message...',
}) => {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim()) {
      onSend(input);
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      <div className="flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isLoading}
          rows={1}
          className={clsx(
            'flex-1 px-4 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-gray-100',
            'max-h-24'
          )}
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          className={clsx(
            'px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition',
            {
              'bg-blue-600 text-white hover:bg-blue-700': !isLoading && input.trim(),
              'bg-gray-300 text-gray-500 cursor-not-allowed': isLoading || !input.trim(),
            }
          )}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};

export default InputBox;
