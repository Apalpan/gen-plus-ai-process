import { useEffect, useRef, useState } from 'react';
import { useProcessStore } from '../../../store/useProcessStore';
import { cn } from '../../../lib/cn';

/** Inline-rename a node by double-clicking its title (no need to open the inspector). */
export function EditableTitle({ id, title, className }: { id: string; title: string; className?: string }) {
  const patchNode = useProcessStore((s) => s.patchNode);
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(title);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => setVal(title), [title]);
  useEffect(() => {
    if (editing) ref.current?.select();
  }, [editing]);

  if (editing) {
    return (
      <textarea
        ref={ref}
        value={val}
        rows={2}
        autoFocus
        onChange={(e) => setVal(e.target.value)}
        onClick={(e) => e.stopPropagation()}
        onBlur={() => {
          patchNode(id, { title: val.trim() || title });
          setEditing(false);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            e.currentTarget.blur();
          }
          if (e.key === 'Escape') {
            setVal(title);
            setEditing(false);
          }
        }}
        className={cn(
          'nodrag w-full resize-none rounded-md border border-brand-400/60 bg-ink-900/80 px-1.5 py-0.5 text-center text-white outline-none',
          className,
        )}
      />
    );
  }

  return (
    <div
      className={cn('cursor-text', className)}
      title="Doble clic para renombrar"
      onDoubleClick={(e) => {
        e.stopPropagation();
        setEditing(true);
      }}
    >
      {title}
    </div>
  );
}
