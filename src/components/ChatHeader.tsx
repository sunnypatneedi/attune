'use client';

import React from 'react';

const ChatHeader = () => {
  return (
    <div className="flex-none w-full p-4 bg-gradient-to-r from-chat-user/70 to-chat-system/70 backdrop-blur-lg border-b border-white/5">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-semibold text-white">Adaptive Chat UI</h1>
        <p className="text-white/70">Watch how the system analyzes your messages in real-time</p>
      </div>
    </div>
  );
};

export default ChatHeader;
