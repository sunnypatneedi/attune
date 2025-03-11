'use client';

import dynamic from 'next/dynamic';

// Use dynamic import with SSR disabled for components that use browser APIs
const Navigation = dynamic(
  () => import('../components/common/navigation').then(mod => ({ default: mod.default })),
  { ssr: false }
);

export default function NavigationWrapper() {
  return <Navigation />;
}
