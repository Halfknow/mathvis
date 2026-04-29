import { clsx } from 'clsx';
import { useState } from 'react';
import type { ReactNode } from 'react';

interface Tab {
  id: string;
  label: string;
  content: ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultTabId?: string;
  className?: string;
}

/**
 * Tabs — horizontal tabbed switcher. Underline indicator (no pills,
 * no buttons). Used for lesson content variants (e.g. "Visual" / "Formal").
 */
export function Tabs({ tabs, defaultTabId, className }: TabsProps) {
  const [activeId, setActiveId] = useState(defaultTabId ?? tabs[0]?.id);
  const active = tabs.find((t) => t.id === activeId) ?? tabs[0];

  return (
    <div className={className}>
      <div role="tablist" className="flex gap-6 border-b border-rule">
        {tabs.map((tab) => {
          const isActive = tab.id === activeId;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveId(tab.id)}
              className={clsx(
                'relative -mb-px py-3 font-sans text-sm font-medium',
                'transition-colors duration-fast ease-smooth',
                isActive
                  ? 'text-ink'
                  : 'text-ink-faint hover:text-ink-muted',
              )}
            >
              {tab.label}
              {isActive && (
                <span className="absolute inset-x-0 -bottom-px h-0.5 bg-accent" />
              )}
            </button>
          );
        })}
      </div>
      <div role="tabpanel" className="pt-6">
        {active?.content}
      </div>
    </div>
  );
}
