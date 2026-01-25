import React from 'react';
import { Bold, Italic, List, Type, Link, Code } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder, className }) => {
  const insertFormat = (format: string) => {
    // Simple mock insertion - in a real app this would interact with selection
    onChange(value + format);
  };

  return (
    <div className={`border border-gray-200 dark:border-zinc-700 rounded-lg overflow-hidden bg-white dark:bg-zinc-800 ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900">
        <button type="button" onClick={() => insertFormat('**bold** ')} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-600 dark:text-gray-300 transition-colors" title="Bold">
          <Bold className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => insertFormat('*italic* ')} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-600 dark:text-gray-300 transition-colors" title="Italic">
          <Italic className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-gray-300 dark:bg-zinc-700 mx-1"></div>
        <button type="button" onClick={() => insertFormat('# Heading ')} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-600 dark:text-gray-300 transition-colors" title="Heading">
          <Type className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => insertFormat('- List item\n')} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-600 dark:text-gray-300 transition-colors" title="List">
          <List className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => insertFormat('`code` ')} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-600 dark:text-gray-300 transition-colors" title="Code">
          <Code className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-gray-300 dark:bg-zinc-700 mx-1"></div>
        <button type="button" onClick={() => insertFormat('[Link Text](url) ')} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-600 dark:text-gray-300 transition-colors" title="Link">
          <Link className="w-4 h-4" />
        </button>
        <div className="flex-1"></div>
        <span className="text-[10px] uppercase font-bold text-gray-400 select-none">Markdown Editor</span>
      </div>

      {/* Editor Area */}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full p-4 min-h-[200px] bg-transparent outline-none resize-y font-mono text-sm leading-relaxed"
      />
      
      {/* Footer */}
      <div className="px-3 py-1.5 bg-gray-50 dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-700 text-xs text-gray-500 flex justify-end">
         {value.length} characters
      </div>
    </div>
  );
};