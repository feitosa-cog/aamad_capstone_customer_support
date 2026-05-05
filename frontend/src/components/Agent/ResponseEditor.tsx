import React, { useState } from 'react';
import { Send } from 'lucide-react';

export const ResponseEditor: React.FC = () => {
  const [response, setResponse] = useState('');

  const handleSend = () => {
    if (response.trim()) {
      console.log('Sending response:', response);
      setResponse('');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-3">
      <h3 className="font-semibold text-gray-900">Compose Response</h3>
      
      <textarea
        value={response}
        onChange={(e) => setResponse(e.target.value)}
        placeholder="Type your response to the customer..."
        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
        rows={4}
      />

      <div className="flex gap-2">
        <button className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
          Quick Reply
        </button>
        <button
          onClick={handleSend}
          disabled={!response.trim()}
          className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:bg-gray-300 flex items-center justify-center gap-2"
        >
          <Send size={16} />
          Send
        </button>
      </div>

      <button className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-left">
        🤖 Suggest Response
      </button>
    </div>
  );
};

export default ResponseEditor;
