import React from 'react';
import ChatContainer from '../components/ChatWidget/ChatContainer';
import Header from '../components/Common/Header';

export const ChatPage: React.FC = () => {
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header title="Support Chat" />
      <div className="flex-1 flex items-center justify-center">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              How can we help?
            </h1>
            <p className="text-gray-600">
              Ask anything about orders, products, returns, or account issues.
            </p>
          </div>
          <ChatContainer position="bottom-right" />
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
