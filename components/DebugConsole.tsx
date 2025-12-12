import React, { useEffect, useRef } from 'react';

interface DebugConsoleProps {
  logs: string[];
}

export const DebugConsole: React.FC<DebugConsoleProps> = ({ logs }) => {
  const endRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="absolute bottom-8 left-8 w-80 h-48 bg-black/90 border border-green-500/40 rounded-sm p-2 font-mono text-[10px] text-green-400 overflow-hidden z-30 pointer-events-none shadow-[0_0_10px_rgba(34,197,94,0.2)]">
      <div className="border-b border-green-500/30 mb-1 pb-1 flex justify-between items-center bg-green-900/20 px-1">
        <span className="font-bold">DEV_CONSOLE_OUTPUT // TTY1</span>
        <div className="flex items-center gap-2">
            <span className="text-[8px] opacity-70">LATENCY: 12ms</span>
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
        </div>
      </div>
      <div className="flex flex-col h-full overflow-hidden relative">
        <div className="absolute inset-0 overflow-y-auto pb-4 custom-scrollbar">
            {logs.map((log, i) => (
            <div key={i} className="whitespace-pre-wrap leading-tight opacity-90 hover:bg-green-900/30">
                <span className="text-green-600 mr-1 select-none">[{i.toString().padStart(3, '0')}]</span>
                {log}
            </div>
            ))}
            <div ref={endRef} />
        </div>
      </div>
      
      {/* Scanline effect */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_2px,3px_100%] pointer-events-none opacity-20"></div>
    </div>
  );
};
