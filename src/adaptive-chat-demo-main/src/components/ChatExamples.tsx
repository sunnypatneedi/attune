
import React from 'react';

type ChatExamplesProps = {
  onSendMessage: (message: string) => void;
};

const testExamples = [
  "Hello! How are you today?",
  "What's the weather forecast for tomorrow?",
  "Can you schedule a meeting with Sarah at 2pm?",
  "Tell me more about this marketing campaign!",
  "Could you remind me to call John later?",
  "I need help with my presentation for tomorrow."
];

const ChatExamples: React.FC<ChatExamplesProps> = ({ onSendMessage }) => {
  if (!onSendMessage) return null;

  return (
    <div className="absolute bottom-28 left-1/2 transform -translate-x-1/2 w-full max-w-xl">
      <div className="p-5 glass-dark rounded-xl border border-white/10 backdrop-blur-lg animate-fade-in">
        <h3 className="text-white font-semibold mb-3 text-lg">Try These Examples</h3>
        <p className="text-white/70 mb-4 text-sm">Click any message to send it instantly:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {testExamples.map((example, i) => (
            <button
              key={i}
              onClick={() => onSendMessage(example)}
              className="text-sm text-left p-3 rounded-lg bg-white/5 hover:bg-white/10 text-white/90 transition-colors border border-white/5 hover:border-white/20 hover:shadow-lg hover:-translate-y-0.5 transform duration-300"
            >
              "{example}"
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChatExamples;
