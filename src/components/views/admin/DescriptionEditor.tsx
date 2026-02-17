'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Bold, Underline, Italic, AlignLeft, AlignCenter, AlignRight,
  Link as LinkIcon, Minus, Video, Type, X, ChevronDown, 
  Palette, List, ListOrdered, Undo, Redo, Plus, Ban
} from 'lucide-react';

// --- Interfaces ---
interface DescriptionEditorProps {
  value: string;
  onChange: (value: string) => void;
}

interface ToolBtnProps {
  icon: React.ElementType;
  action: () => void;
  active?: boolean;
  label?: string;
}

const COLORS = ['#ffffff', '#ef4444', '#10b981', '#3b82f6', '#f59e0b', '#a855f7', '#ec4899', '#64748b'];
const DEFAULT_TEXT_COLOR = 'rgb(209, 213, 219)'; // gray-300

export default function DescriptionEditor({ value, onChange }: DescriptionEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [activeMenu, setActiveMenu] = useState<'color' | 'size' | 'add' | null>(null);

  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    justifyLeft: false,
    justifyCenter: false,
    justifyRight: false,
    insertUnorderedList: false,
    insertOrderedList: false,
    fontSize: '3', 
    foreColor: DEFAULT_TEXT_COLOR,
  });

  // Sync initial value - Added 'value' to dependencies to fix React Hook warning
  useEffect(() => {
    if (editorRef.current && value && editorRef.current.innerHTML === '') {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  // Click Outside Listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const updateActiveStates = () => {
    if (!document || !editorRef.current) return;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !editorRef.current.contains(selection.anchorNode)) return;

    setActiveFormats({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      justifyLeft: document.queryCommandState('justifyLeft'),
      justifyCenter: document.queryCommandState('justifyCenter'),
      justifyRight: document.queryCommandState('justifyRight'),
      insertUnorderedList: document.queryCommandState('insertUnorderedList'),
      insertOrderedList: document.queryCommandState('insertOrderedList'),
      fontSize: document.queryCommandValue('fontSize') || '3',
      foreColor: document.queryCommandValue('foreColor') || DEFAULT_TEXT_COLOR,
    });
  };

  useEffect(() => {
    document.addEventListener('selectionchange', updateActiveStates);
    return () => document.removeEventListener('selectionchange', updateActiveStates);
  }, []);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCmd = (command: string, val: string | undefined = undefined) => {
    document.execCommand(command, false, val);
    editorRef.current?.focus();
    handleInput();
    updateActiveStates();
  };

  const handleInsertVideo = () => {
    const url = prompt("Enter YouTube Video URL:");
    if (url) {
      const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
      if (ytMatch && ytMatch[1]) {
        const videoHtml = `
          <div class="relative w-full aspect-video my-4 rounded-lg overflow-hidden border border-[#333]">
            <iframe src="https://www.youtube.com/embed/${ytMatch[1]}" class="absolute top-0 left-0 w-full h-full" frameborder="0" allowfullscreen></iframe>
          </div><br/>`;
        execCmd('insertHTML', videoHtml);
      }
    }
    setActiveMenu(null);
  };

  // Fixed 'any' type error by using ToolBtnProps interface
  const ToolBtn = ({ icon: Icon, action, active = false, label }: ToolBtnProps) => (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); action(); }}
      className={`p-2 rounded-md transition-all ${active ? 'bg-rose-600 text-white shadow-lg' : 'text-gray-400 hover:bg-[#2a2a2a] hover:text-white'}`}
      title={label}
    >
      <Icon size={16} strokeWidth={active ? 3 : 2.5} />
    </button>
  );

  return (
    <div className="flex flex-col gap-2 w-full">
      <div ref={toolbarRef} className="bg-[#1a1a1a] border border-[#333] rounded-xl p-2 flex flex-wrap items-center gap-1 shadow-xl relative z-20">
        
        <div className="flex items-center gap-1 pr-2 border-r border-[#333]">
           <ToolBtn icon={Undo} action={() => execCmd('undo')} />
           <ToolBtn icon={Redo} action={() => execCmd('redo')} />
        </div>

        <div className="relative border-r border-[#333] pr-2">
           <button 
             type="button"
             onMouseDown={(e) => { e.preventDefault(); setActiveMenu(activeMenu === 'size' ? null : 'size'); }}
             className={`p-2 rounded-md flex items-center gap-1 transition ${activeMenu === 'size' ? 'text-white bg-[#2a2a2a]' : 'text-gray-400 hover:text-white'}`}
           >
             <Type size={16} /> <ChevronDown size={12}/>
           </button>
           {activeMenu === 'size' && (
             <div className="absolute top-full left-0 mt-2 bg-[#0f0f0f] border border-[#333] rounded-lg shadow-xl z-50 flex flex-col w-32 overflow-hidden">
                {[2, 3, 4, 5, 6].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); execCmd('fontSize', size.toString()); setActiveMenu(null); }}
                    className={`px-4 py-2 text-left text-sm ${activeFormats.fontSize == size.toString() ? 'bg-rose-900/20 text-rose-500' : 'text-gray-300 hover:bg-[#222]'}`}
                  >
                    Size {size}
                  </button>
                ))}
             </div>
           )}
        </div>

        <div className="flex items-center gap-1 pr-2 border-r border-[#333]">
          <ToolBtn icon={Bold} action={() => execCmd('bold')} active={activeFormats.bold} />
          <ToolBtn icon={Italic} action={() => execCmd('italic')} active={activeFormats.italic} />
          <ToolBtn icon={Underline} action={() => execCmd('underline')} active={activeFormats.underline} />
        </div>

        <div className="flex items-center gap-1 pr-2 border-r border-[#333]">
          <ToolBtn icon={List} action={() => execCmd('insertUnorderedList')} active={activeFormats.insertUnorderedList} />
          <ToolBtn icon={ListOrdered} action={() => execCmd('insertOrderedList')} active={activeFormats.insertOrderedList} />
        </div>

        <div className="flex items-center gap-1 pr-2 border-r border-[#333]">
          <ToolBtn icon={AlignLeft} action={() => execCmd('justifyLeft')} active={activeFormats.justifyLeft} />
          <ToolBtn icon={AlignCenter} action={() => execCmd('justifyCenter')} active={activeFormats.justifyCenter} />
          <ToolBtn icon={AlignRight} action={() => execCmd('justifyRight')} active={activeFormats.justifyRight} />
        </div>

        <div className="relative">
          <button 
            type="button"
            onMouseDown={(e) => { e.preventDefault(); setActiveMenu(activeMenu === 'color' ? null : 'color'); }}
            className={`p-2 rounded-md flex items-center gap-1 transition ${activeMenu === 'color' ? 'text-white bg-[#2a2a2a]' : 'text-gray-400 hover:text-white'}`}
          >
            <Palette size={16} /> <ChevronDown size={12}/>
          </button>
          {activeMenu === 'color' && (
            <div className="absolute top-full left-0 mt-2 p-2 bg-[#0f0f0f] border border-[#333] rounded-lg shadow-xl z-50 w-40">
               <div className="grid grid-cols-4 gap-2 mb-2">
                  {COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); execCmd('foreColor', color); setActiveMenu(null); }}
                      className="w-6 h-6 rounded-full border border-white/10 hover:scale-110 transition"
                      style={{ backgroundColor: color }}
                    />
                  ))}
               </div>
               <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); execCmd('foreColor', DEFAULT_TEXT_COLOR); setActiveMenu(null); }}
                  className="w-full flex items-center justify-center gap-2 py-1 rounded-md border border-[#333] text-[10px] text-gray-400 hover:text-white transition"
               >
                  <Ban size={10} /> Reset
               </button>
            </div>
          )}
        </div>

        <div className="flex-1"></div>

        <div className="relative">
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); setActiveMenu(activeMenu === 'add' ? null : 'add'); }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${activeMenu === 'add' ? 'bg-rose-600 text-white' : 'bg-[#2a2a2a] text-gray-300 hover:bg-white hover:text-black'}`}
          >
             {activeMenu === 'add' ? <X size={14} /> : <Plus size={14} />} <span>Tools</span>
          </button>

          {activeMenu === 'add' && (
            <div className="absolute right-0 top-full mt-2 w-40 bg-[#111] border border-[#333] rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden">
              <button onClick={handleInsertVideo} className="flex items-center gap-3 px-4 py-3 hover:bg-[#1f1f1f] text-gray-300 text-sm transition-colors text-left"><Video size={14} className="text-rose-500"/> Video</button>
              <button onClick={() => { const url = prompt("URL:"); if(url) execCmd('createLink', url); setActiveMenu(null); }} className="flex items-center gap-3 px-4 py-3 hover:bg-[#1f1f1f] text-gray-300 text-sm transition-colors text-left"><LinkIcon size={14} className="text-green-500"/> Link</button>
              <button onClick={() => { execCmd('insertHorizontalRule'); setActiveMenu(null); }} className="flex items-center gap-3 px-4 py-3 hover:bg-[#1f1f1f] text-gray-300 text-sm transition-colors text-left"><Minus size={14} className="text-gray-500"/> Divider</button>
            </div>
          )}
        </div>
      </div>

      <div 
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="w-full min-h-[300px] bg-[#0f0f0f] border border-[#333] rounded-xl p-6 text-gray-300 focus:outline-none focus:border-rose-600/50 transition-all prose prose-invert max-w-none"
        style={{ whiteSpace: 'pre-wrap' }}
      />
    </div>
  );
}
