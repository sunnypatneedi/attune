'use client';

import React from 'react';
import { Info, ChevronRight } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useChatState } from '@/hooks/use-chat-state';
import InfoPanel from './InfoPanel';
import ChatHeader from './ChatHeader';
import ChatContainer from './ChatContainer';
import { 
  detectIntention, 
  extractEntities, 
  extractTopics, 
  updatePatterns, 
  generateResponse 
} from '@/utils/message-processing';

const ChatInterface: React.FC = () => {
  const {
    messages,
    setMessages,
    workingMemory,
    setWorkingMemory,
    patterns,
    setPatterns,
    isProcessing,
    setIsProcessing
  } = useChatState();

  const [showInfoPanel, setShowInfoPanel] = React.useState(true);
  const isMobile = useIsMobile();

  React.useEffect(() => {
    if (isMobile) {
      setShowInfoPanel(false);
    }
  }, [isMobile]);

  const handleSendMessage = async (content: string) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    
    const newMessageId = Date.now().toString();
    const userMessage = {
      id: newMessageId,
      content,
      isUser: true,
      timestamp: new Date().toLocaleTimeString(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    setTimeout(() => {
      const newEntities = extractEntities(content);
      const newTopics = extractTopics(content);
      
      setWorkingMemory(prev => ({
        activeTopics: [...new Set([...prev.activeTopics, ...newTopics])],
        recentEntities: [...newEntities, ...prev.recentEntities].slice(0, 5),
        turns: prev.turns + 1,
      }));
      
      setPatterns(prev => updatePatterns(content, prev));
      
      const intention = detectIntention(content);
      const systemResponse = {
        id: (Date.now() + 1).toString(),
        content: generateResponse(content, intention),
        isUser: false,
        intention,
        entities: newEntities.map(e => {
          const [name, type] = e.split(' (');
          return { name, type: type.replace(')', '') };
        }),
        timestamp: new Date().toLocaleTimeString(),
      };
      
      setMessages(prev => [...prev, systemResponse]);
      setIsProcessing(false);
    }, 1000);
  };

  return (
    <div className="w-full h-screen flex flex-col bg-gradient-to-b from-chat-system/30 to-black/60">
      <ChatHeader />
      
      <div className="flex-1 flex flex-row overflow-hidden">
        <ChatContainer
          messages={messages}
          isProcessing={isProcessing}
          onSendMessage={handleSendMessage}
        />
        
        {showInfoPanel && (
          <div className="w-80 border-l border-white/10 animate-slide-in-right">
            <InfoPanel 
              workingMemory={workingMemory}
              patterns={patterns}
              hasMessages={messages.length > 1}
            />
          </div>
        )}
        
        <button
          onClick={() => setShowInfoPanel(prev => !prev)}
          className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-chat-accent text-background p-2 rounded-l-md hover:bg-chat-accent/90 transition-all duration-300"
          style={{ right: showInfoPanel ? '20rem' : 0 }}
          aria-label={showInfoPanel ? "Hide info panel" : "Show info panel"}
        >
          {showInfoPanel ? <ChevronRight size={16} /> : <Info size={16} />}
        </button>
      </div>
    </div>
  );
};

export default ChatInterface;
