'use client';

import React, { useRef } from 'react';
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  Link2,
  Eraser,
  Quote
} from 'lucide-react';

interface RichTextEditorProps {
  onChange: (html: string) => void;
  placeholder?: string;
}

/**
 * Lightweight dependency-free WYSIWYG editor built on contentEditable.
 * Uncontrolled by design — the parent reads HTML via onChange. To reset it,
 * remount with a changing `key` prop.
 */
export default function RichTextEditor({ onChange, placeholder }: RichTextEditorProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handleInput = () => {
    if (ref.current) onChange(ref.current.innerHTML);
  };

  const exec = (cmd: string, value?: string) => {
    document.execCommand(cmd, false, value);
    ref.current?.focus();
    handleInput();
  };

  const addLink = () => {
    const url = window.prompt('Enter the link URL:');
    if (url) exec('createLink', url);
  };

  const ToolBtn = ({
    onClick,
    title,
    children
  }: {
    onClick: () => void;
    title: string;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      title={title}
      // Keep the editor's text selection while clicking a toolbar button.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-indigo-500/15 transition-colors cursor-pointer"
    >
      {children}
    </button>
  );

  return (
    <div className="rounded-xl border border-slate-900 bg-slate-950 overflow-hidden focus-within:border-indigo-500/50 transition-colors">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-1.5 border-b border-slate-900 bg-slate-900/40">
        <ToolBtn onClick={() => exec('formatBlock', 'H2')} title="Heading"><Heading2 className="w-4 h-4" /></ToolBtn>
        <ToolBtn onClick={() => exec('formatBlock', 'H3')} title="Subheading"><Heading3 className="w-4 h-4" /></ToolBtn>
        <div className="w-px h-5 bg-slate-800 mx-1" />
        <ToolBtn onClick={() => exec('bold')} title="Bold"><Bold className="w-4 h-4" /></ToolBtn>
        <ToolBtn onClick={() => exec('italic')} title="Italic"><Italic className="w-4 h-4" /></ToolBtn>
        <ToolBtn onClick={() => exec('underline')} title="Underline"><Underline className="w-4 h-4" /></ToolBtn>
        <div className="w-px h-5 bg-slate-800 mx-1" />
        <ToolBtn onClick={() => exec('insertUnorderedList')} title="Bullet list"><List className="w-4 h-4" /></ToolBtn>
        <ToolBtn onClick={() => exec('insertOrderedList')} title="Numbered list"><ListOrdered className="w-4 h-4" /></ToolBtn>
        <ToolBtn onClick={() => exec('formatBlock', 'BLOCKQUOTE')} title="Quote"><Quote className="w-4 h-4" /></ToolBtn>
        <div className="w-px h-5 bg-slate-800 mx-1" />
        <ToolBtn onClick={addLink} title="Insert link"><Link2 className="w-4 h-4" /></ToolBtn>
        <ToolBtn onClick={() => exec('removeFormat')} title="Clear formatting"><Eraser className="w-4 h-4" /></ToolBtn>
      </div>

      {/* Editable area */}
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        data-placeholder={placeholder || 'Start writing your notes...'}
        className="rte-content rte-prose min-h-[220px] max-h-[380px] overflow-y-auto p-4 text-sm text-slate-200 leading-relaxed focus:outline-none"
      />
    </div>
  );
}
