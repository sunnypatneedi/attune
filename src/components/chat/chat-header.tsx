'use client';

import { useChatStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  PanelLeft,
  PanelRight,
  Plus,
  Sun,
  Moon,
  Shield,
  ShieldCheck,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createConversation } from '@/app/chat/actions';
import { useEffect, useState } from 'react';
import type { ModelOption } from '@/lib/ai/provider-config';

interface SecurityInfo {
  mode: string;
  policy: string;
  enabled: boolean;
  stats: { total: number; blocked: number; riskEvents: number };
}

export function ChatHeader() {
  const {
    toggleSidebar,
    toggleInfoPanel,
    mode,
    setMode,
    model,
    setModel,
    addConversation,
    setActiveConversation,
  } = useChatStore();
  const router = useRouter();
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [availableModels, setAvailableModels] = useState<ModelOption[]>([]);
  const [hasApiKeys, setHasApiKeys] = useState(false);
  const [security, setSecurity] = useState<SecurityInfo | null>(null);

  useEffect(() => {
    // Check theme
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');

    // Fetch available models
    fetch('/api/models')
      .then((r) => r.json())
      .then((data) => {
        setAvailableModels(data.models);
        setHasApiKeys(data.hasApiKeys);
        if (data.hasApiKeys && data.models.length > 0) {
          setMode('ai');
          setModel(data.models[0].id);
        }
      })
      .catch(() => {
        // No API keys, stay in simulated mode
      });

    // Fetch SPEAR security status
    fetch('/api/security')
      .then((r) => r.json())
      .then((data) => setSecurity(data))
      .catch(() => {
        // Security endpoint not available
      });
  }, [setMode, setModel]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    localStorage.setItem('theme', newTheme);
  };

  const handleNewChat = async () => {
    const convo = await createConversation();
    addConversation({ id: convo.id, title: convo.title, updatedAt: convo.updatedAt });
    setActiveConversation(convo.id);
    router.push(`/chat/${convo.id}`);
  };

  return (
    <TooltipProvider delayDuration={300}>
      <header className="flex items-center justify-between px-4 h-14 border-b bg-background/80 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleSidebar} aria-label="Toggle sidebar">
            <PanelLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-semibold tracking-tight">Attune</h1>

          {/* SPEAR Security Badge */}
          {security?.enabled && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <ShieldCheck className="h-3 w-3 text-emerald-500" />
                  <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                    SPEAR
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs max-w-[220px]">
                <p className="font-medium">Protected by SPEAR</p>
                <p className="text-muted-foreground mt-0.5">
                  Policy: {security.policy} | Mode: {security.mode}
                </p>
                {security.stats.total > 0 && (
                  <p className="text-muted-foreground mt-0.5">
                    {security.stats.total} checks, {security.stats.blocked} blocked
                  </p>
                )}
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={mode === 'simulated' ? 'demo' : model}
            onValueChange={(v) => {
              if (v === 'demo') {
                setMode('simulated');
                setModel('demo');
              } else {
                setMode('ai');
                setModel(v);
              }
            }}
          >
            <SelectTrigger className="w-[160px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="demo">Demo Mode</SelectItem>
              {availableModels.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="ghost" size="icon" onClick={handleNewChat} aria-label="New chat">
            <Plus className="h-4 w-4" />
          </Button>

          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <Button variant="ghost" size="icon" onClick={toggleInfoPanel} aria-label="Toggle info panel">
            <PanelRight className="h-4 w-4" />
          </Button>
        </div>
      </header>
    </TooltipProvider>
  );
}
