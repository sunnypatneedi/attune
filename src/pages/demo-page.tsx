import React from 'react';
import { EnhancedChatDemo } from '../components/demo/enhanced-chat-demo';

/**
 * Page that renders the enhanced chat demo
 */
export const DemoPage: React.FC = () => {
  return (
    <div className="demo-page">
      <EnhancedChatDemo />
    </div>
  );
};

export default DemoPage;
