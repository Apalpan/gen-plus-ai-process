import { useEffect, useRef, useState } from 'react';
import { Send, Bot, Copy, Check } from 'lucide-react';
import { useProcessStore } from '../../store/useProcessStore';
import { COPILOT_SUGGESTIONS } from '../../ai/copilot';
import { copyToClipboard } from '../../lib/download';
import { cn } from '../../lib/cn';

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative mt-2 rounded-btn border border-[var(--gen-border)] bg-ink-900/80">
      <button
        onClick={async () => {
          if (await copyToClipboard(code)) {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }
        }}
        className="absolute right-1.5 top-1.5 rounded-md bg-white/[0.06] p-1.5 text-brand-200 hover:bg-white/[0.12]"
        title="Copiar"
      >
        {copied ? <Check size={13} /> : <Copy size={13} />}
      </button>
      <pre className="max-h-44 overflow-auto p-3 pr-9 font-mono text-[10.5px] leading-relaxed text-brand-100">{code}</pre>
    </div>
  );
}

export function AIConversationPanel() {
  const chat = useProcessStore((s) => s.chat);
  const sendCopilot = useProcessStore((s) => s.sendCopilot);
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  const send = () => {
    if (!input.trim()) return;
    sendCopilot(input);
    setInput('');
  };

  return (
    <div className="flex h-full flex-col border-t border-[var(--gen-border)]">
      <div className="flex items-center gap-2 px-4 py-2.5">
        <span className="relative flex h-6 w-6 items-center justify-center rounded-full bg-brand-500/20">
          <Bot size={14} className="text-brand-300" />
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-accent-green" />
        </span>
        <span className="text-[13px] font-semibold">Process Copilot</span>
      </div>

      <div className="flex-1 space-y-2.5 overflow-y-auto px-3 py-2">
        {chat.map((m) => (
          <div key={m.id} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div
              className={cn(
                'max-w-[92%] rounded-card px-3 py-2 text-[12.5px] leading-relaxed',
                m.role === 'user'
                  ? 'bg-brand-500 text-white'
                  : 'gen-surface text-[var(--gen-text-secondary)]',
              )}
            >
              <span className="whitespace-pre-wrap">{m.text}</span>
              {m.code && <CodeBlock code={m.code} />}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="flex flex-wrap gap-1 px-3 pb-2">
        {COPILOT_SUGGESTIONS.slice(0, 5).map((s) => (
          <button
            key={s}
            onClick={() => sendCopilot(s)}
            className="rounded-full border border-[var(--gen-border)] bg-white/[0.03] px-2.5 py-1 text-[11px] text-brand-200 transition-colors hover:bg-white/[0.08]"
          >
            {s}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 border-t border-[var(--gen-border)] p-2.5">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Pide un cambio: simplifica, agrega métricas…"
          className="min-h-[44px] flex-1 rounded-btn bg-ink-900/60 px-3 text-[13px] text-white outline-none placeholder:text-[var(--gen-text-muted)] focus-visible:shadow-focus"
        />
        <button
          onClick={send}
          aria-label="Enviar"
          className="flex h-11 w-11 items-center justify-center rounded-btn bg-brand-500 text-white transition-colors hover:bg-brand-400 focus-visible:shadow-focus"
        >
          <Send size={17} />
        </button>
      </div>
    </div>
  );
}
