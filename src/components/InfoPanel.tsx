'use client';

import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

type PanelSectionProps = {
  title: string;
  isOpen?: boolean;
  toggleOpen?: () => void;
  children: React.ReactNode;
};

type InfoPanelProps = {
  workingMemory: {
    activeTopics: string[];
    recentEntities: string[];
    turns: number;
  };
  patterns: Array<{
    name: string;
    confidence: number;
  }>;
  hasMessages: boolean;
};

const PanelSection: React.FC<PanelSectionProps> = ({
  title,
  children,
  isOpen = true,
  toggleOpen,
}) => {
  return (
    <div className="mb-6 animate-fade-in">
      <div 
        className="flex items-center mb-3 cursor-pointer"
        onClick={toggleOpen}
      >
        {toggleOpen ? (
          isOpen ? <ChevronDown className="text-chat-accent mr-2 w-4 h-4" /> : <ChevronRight className="text-chat-accent mr-2 w-4 h-4" />
        ) : null}
        <h3 className="section-title">{title}</h3>
      </div>
      {isOpen && <div className="pl-2">{children}</div>}
    </div>
  );
};

const InfoPanel: React.FC<InfoPanelProps> = ({
  workingMemory,
  patterns,
  hasMessages,
}) => {
  return (
    <div className="w-full h-full p-6 glass-dark overflow-y-auto scrollbar-thin flex flex-col">
      <h2 className="font-outfit text-lg font-semibold mb-6 text-white">Working Memory</h2>
      
      <PanelSection title="Active Topics">
        {workingMemory.activeTopics.length > 0 ? (
          <ul className="space-y-2">
            {workingMemory.activeTopics.map((topic, i) => (
              <li key={i} className="text-white/80 text-sm">{topic}</li>
            ))}
          </ul>
        ) : (
          <p className="text-white/50 text-sm italic">None</p>
        )}
      </PanelSection>
      
      <PanelSection title="Recent Entities">
        {workingMemory.recentEntities.length > 0 ? (
          <ul className="space-y-2">
            {workingMemory.recentEntities.map((entity, i) => (
              <li key={i} className="text-white/80 text-sm">{entity}</li>
            ))}
          </ul>
        ) : (
          <p className="text-white/50 text-sm italic">None</p>
        )}
      </PanelSection>
      
      <PanelSection title="Conversation Turns">
        <p className="text-white/80 text-sm">{workingMemory.turns}</p>
      </PanelSection>
      
      <div className="border-t border-white/10 my-6"></div>
      
      <h2 className="font-outfit text-lg font-semibold mb-6 text-white">Detected Patterns</h2>
      
      {patterns.length > 0 ? (
        <div className="space-y-4">
          {patterns.map((pattern, i) => (
            <div key={i} className="info-section">
              <div className="flex justify-between items-center mb-2">
                <div className="text-white font-medium text-sm">{pattern.name}</div>
                <div className="text-chat-accent text-xs">{pattern.confidence}% confidence</div>
              </div>
              <div className="w-full bg-white/10 rounded-full h-1.5">
                <div 
                  className="bg-chat-accent h-1.5 rounded-full"
                  style={{ width: `${pattern.confidence}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          {hasMessages ? (
            <p className="text-white/50 text-sm">No patterns detected yet. Try adding more messages.</p>
          ) : (
            <p className="text-white/50 text-sm">Patterns will be detected as you add messages.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default InfoPanel;
