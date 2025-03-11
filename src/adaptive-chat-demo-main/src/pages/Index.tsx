
import React from 'react';
import ChatInterface from '@/components/ChatInterface';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-black/90 text-foreground">
      <ChatInterface />
      
      {/* Badge */}
      <div className="fixed bottom-2 right-2 text-xs text-white/40">
        <span className="opacity-50">Adaptive Chat UI • Demo</span>
      </div>
    </div>
  );
};

export default Index;
