import { useEffect, useRef, useState } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link as LinkIcon,
  Code,
  Eraser,
} from 'lucide-react';

interface Props {
  value: string;
  onChange: (html: string) => void;
}

// Lightweight WYSIWYG editor (contentEditable + execCommand) that emits HTML.
// Includes a "source" toggle to edit raw HTML directly.
export function RichTextEditor({ value, onChange }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [showSource, setShowSource] = useState(false);

  // Keep the DOM in sync when the incoming value changes (e.g. after load),
  // but avoid clobbering the caret while the user is actively typing.
  useEffect(() => {
    if (ref.current && !showSource && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || '';
    }
  }, [value, showSource]);

  function exec(command: string, arg?: string) {
    document.execCommand(command, false, arg);
    if (ref.current) onChange(ref.current.innerHTML);
  }

  function addLink() {
    const url = window.prompt('Link URL:', 'https://');
    if (url) exec('createLink', url);
  }

  const tools = [
    { icon: Bold, action: () => exec('bold'), title: 'Bold' },
    { icon: Italic, action: () => exec('italic'), title: 'Italic' },
    { icon: Underline, action: () => exec('underline'), title: 'Underline' },
    { icon: Heading2, action: () => exec('formatBlock', 'H2'), title: 'Heading 2' },
    { icon: Heading3, action: () => exec('formatBlock', 'H3'), title: 'Heading 3' },
    { icon: List, action: () => exec('insertUnorderedList'), title: 'Bullet list' },
    { icon: ListOrdered, action: () => exec('insertOrderedList'), title: 'Numbered list' },
    { icon: LinkIcon, action: addLink, title: 'Insert link' },
    { icon: Eraser, action: () => exec('removeFormat'), title: 'Clear formatting' },
  ];

  return (
    <div className="overflow-hidden rounded-lg border border-slate-300">
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 px-2 py-1.5">
        {tools.map((t, i) => (
          <button
            key={i}
            type="button"
            title={t.title}
            onMouseDown={(e) => {
              e.preventDefault(); // keep selection
              t.action();
            }}
            className="rounded p-1.5 text-ink-700 hover:bg-slate-200"
          >
            <t.icon size={16} />
          </button>
        ))}
        <div className="mx-1 h-5 w-px bg-slate-300" />
        <button
          type="button"
          title="Edit HTML source"
          onClick={() => setShowSource((s) => !s)}
          className={`rounded p-1.5 hover:bg-slate-200 ${showSource ? 'bg-slate-200 text-brand-700' : 'text-ink-700'}`}
        >
          <Code size={16} />
        </button>
      </div>

      {showSource ? (
        <textarea
          className="w-full px-3 py-2 font-mono text-xs outline-none"
          rows={8}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
        />
      ) : (
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          onInput={(e) => onChange((e.target as HTMLDivElement).innerHTML)}
          className="prose-editor min-h-[140px] px-3 py-2 text-sm outline-none"
        />
      )}
    </div>
  );
}
