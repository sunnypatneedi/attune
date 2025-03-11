'use client';

import React, { useState, useEffect } from 'react';
import { EnhancedUnderstandingFramework } from '../../lib/enhanced-understanding-framework';
import { EnhancedMessage, Entity, Intention, InteractionPattern, IntentionType } from '../../lib/enhanced-types';
import { eventBus } from '../../lib/event-bus';
import './enhanced-chat-demo.css';

/**
 * Demo component to showcase the enhanced understanding framework
 * This provides a visual representation of how the system enhances a simple chat
 */
export const EnhancedChatDemo: React.FC = () => {
  const [messages, setMessages] = useState<EnhancedMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [framework] = useState(new EnhancedUnderstandingFramework());
  const [patterns, setPatterns] = useState<InteractionPattern[]>([]);
  const [context, setContext] = useState<any>(null);

  // Subscribe to events when component mounts
  useEffect(() => {
    const subscription = eventBus.subscribe(event => {
      if (event.type === 'enhancedUserMessage' || event.type === 'enhancedSystemMessage') {
        setMessages(prev => [...prev, event.payload]);
        
        // Update patterns and context when messages change
        setPatterns(framework.getInteractionPatterns());
        setContext(framework.getContext());
      }
    });

    // Add welcome message
    const systemMessage = framework.processSystemMessage(
      "Welcome to the Enhanced Chat Demo! Try sending messages with different intentions and entities."
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, [framework]);

  const handleSendMessage = () => {
    if (inputText.trim() === '') return;
    
    // Process the user message through the framework
    framework.processUserMessage(inputText);
    
    // Clear input
    setInputText('');
    
    // Generate a response based on the user message
    setTimeout(() => {
      const lastMessage = messages[messages.length - 1];
      let responseText = "I'm processing your message...";
      
      if (lastMessage) {
        // Generate a response based on detected intentions and entities
        if (lastMessage.primaryIntention) {
          switch (lastMessage.primaryIntention.type) {
            case IntentionType.GREETING:
              responseText = "Hello there! How can I help you today?";
              break;
            case IntentionType.QUESTION_FACTUAL:
            case IntentionType.QUESTION_OPINION:
            case IntentionType.QUESTION_CLARIFICATION:
              responseText = "That's an interesting question. Let me think about that...";
              break;
            case IntentionType.COMMAND:
              responseText = "I'll try to do that for you right away.";
              break;
            case IntentionType.REQUEST_ACTION:
              responseText = "I'd be happy to provide that information for you.";
              break;
            default:
              responseText = "I understand your message. Is there anything specific you'd like to know?";
          }
        }
        
        // If entities were detected, mention them
        if (lastMessage.entities && lastMessage.entities.length > 0) {
          const entityNames = lastMessage.entities.map(e => e.value).join(', ');
          responseText += ` I noticed you mentioned: ${entityNames}.`;
        }
      }
      
      // Process the system response through the framework
      framework.processSystemMessage(responseText);
    }, 1000);
  };

  return (
    <div className="enhanced-chat-demo">
      <div className="demo-header">
        <h1>Adaptive Chat UI - Enhanced Understanding Demo</h1>
        <p>See how the system detects intentions, entities, and patterns in real-time</p>
      </div>
      
      <div className="demo-layout">
        <div className="chat-container">
          <div className="message-list">
            {messages.map((message, index) => (
              <div key={index} className={`message-item ${message.sender}`}>
                <div className="message-content">{message.content}</div>
                {message.sender === 'user' && (
                  <div className="message-details">
                    {message.primaryIntention && (
                      <div className="intention-tag">
                        <span className="label">Intention:</span> 
                        <span className="value">{message.primaryIntention.type}</span>
                        <span className="confidence">
                          ({Math.round(message.primaryIntention.confidence * 100)}%)
                        </span>
                      </div>
                    )}
                    
                    {message.entities && message.entities.length > 0 && (
                      <div className="entities-container">
                        <span className="label">Entities:</span>
                        <div className="entity-tags">
                          {message.entities.map((entity, idx) => (
                            <span key={idx} className={`entity-tag ${entity.type.toLowerCase()}`}>
                              {entity.type}: {entity.value}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="message-input-container">
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type a message..."
              className="message-input"
            />
            <button onClick={handleSendMessage} className="send-button">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 2L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
        
        <div className="info-panel">
          <div className="panel-section">
            <h3>Working Memory</h3>
            <div className="context-display">
              {context && (
                <>
                  <div className="context-item">
                    <span className="label">Active Topics:</span>
                    <span className="value">
                      {context.activeTopics && context.activeTopics.length > 0 
                        ? context.activeTopics.join(', ') 
                        : 'None'
                      }
                    </span>
                  </div>
                  <div className="context-item">
                    <span className="label">Recent Entities:</span>
                    <span className="value">
                      {context.recentEntities && context.recentEntities.length > 0 
                        ? context.recentEntities.join(', ') 
                        : 'None'
                      }
                    </span>
                  </div>
                  <div className="context-item">
                    <span className="label">Conversation Turn:</span>
                    <span className="value">{context.turnCount || 0}</span>
                  </div>
                </>
              )}
            </div>
          </div>
          
          <div className="panel-section">
            <h3>Detected Patterns</h3>
            <div className="patterns-display">
              {patterns.length > 0 ? (
                <ul className="patterns-list">
                  {patterns.map((pattern, index) => (
                    <li key={index} className={`pattern-item ${pattern.type.toLowerCase()}`}>
                      <div className="pattern-type">{pattern.type}</div>
                      <div className="pattern-description">{pattern.description}</div>
                      <div className="pattern-confidence">
                        Confidence: {Math.round(pattern.confidence * 100)}%
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="no-patterns">No patterns detected yet. Try having a conversation!</p>
              )}
            </div>
          </div>
          
          <div className="panel-section">
            <h3>Demo Instructions</h3>
            <div className="instructions">
              <p><strong>Try these sample messages:</strong></p>
              <ul>
                <li>Hello! How are you today?</li>
                <li>What's the weather like in San Francisco?</li>
                <li>Tell me about machine learning</li>
                <li>I need to book a flight to New York next Friday</li>
                <li>Can you remind me to call John at 3pm?</li>
              </ul>
              <p>Keep chatting to see how patterns develop over time!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedChatDemo;
