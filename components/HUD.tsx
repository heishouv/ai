import React, { useEffect, useState } from 'react';
import { FaceData, SystemMetrics } from '../types';

interface HUDProps {
  faceData: FaceData | null;
}

const generateRandomMetrics = (): SystemMetrics => ({
  cpu: Math.floor(Math.random() * 30) + 20,
  memory: Math.floor(Math.random() * 20) + 40,
  network: Math.floor(Math.random() * 100),
  power: 100 - Math.floor(Math.random() * 5),
});

export const HUD: React.FC<HUDProps> = ({ faceData }) => {
  const [metrics, setMetrics] = useState<SystemMetrics>(generateRandomMetrics());
  
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(generateRandomMetrics());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Default position if no face detected
  const baseX = faceData ? (1 - faceData.position.x) * 100 : 50;
  const baseY = faceData ? faceData.position.y * 100 : 50;

  // Offset to the right of the head
  const hudX = baseX + 15; 
  const hudY = baseY - 10;

  if (!faceData) return null;

  return (
    <div 
      className="absolute pointer-events-none transition-all duration-100 ease-out z-20"
      style={{
        left: `${Math.min(Math.max(hudX, 0), 90)}%`,
        top: `${Math.min(Math.max(hudY, 0), 80)}%`,
        transform: `translate(-50%, -50%) perspective(1000px) rotateY(-10deg)`,
      }}
    >
      <div className="flex flex-col gap-2 w-64">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cyan-500/50 pb-1 mb-2">
          <span className="text-cyan-400 font-bold tracking-widest text-xs">TARGET: ACTIVE</span>
          <span className="text-cyan-400 text-[10px] animate-pulse">REC ●</span>
        </div>

        {/* Main Circle Graphic */}
        <div className="relative w-full h-32 border border-cyan-500/30 rounded-lg bg-cyan-900/10 backdrop-blur-sm p-3 overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-400"></div>
          <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyan-400"></div>
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-cyan-400"></div>
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-400"></div>

          <div className="grid grid-cols-2 gap-2 h-full">
             {/* Left Column Stats */}
             <div className="flex flex-col justify-around">
                <MetricBar label="CPU" value={metrics.cpu} />
                <MetricBar label="MEM" value={metrics.memory} />
                <MetricBar label="NET" value={metrics.network} />
             </div>
             
             {/* Right Column Radial (Simulated) */}
             <div className="flex items-center justify-center relative">
                <div className="w-16 h-16 border-2 border-cyan-500/50 rounded-full flex items-center justify-center animate-[spin_4s_linear_infinite]">
                    <div className="w-12 h-12 border border-cyan-400/30 rounded-full border-t-transparent"></div>
                </div>
                <div className="absolute text-cyan-300 font-mono text-xl font-bold">{metrics.power}%</div>
             </div>
          </div>
        </div>

        {/* Scrolling Log Data */}
        <div className="h-20 overflow-hidden relative border-l-2 border-cyan-500/50 pl-2">
             <div className="text-[9px] text-cyan-300/80 font-mono leading-tight whitespace-nowrap opacity-80">
                <p>> SYSTEM_CHECK_INIT</p>
                <p>> BIOMETRICS_LOCKED</p>
                <p>> CONNECTING_TO_MAIN_SERVER...</p>
                <p>> SECURE_CHANNEL_ESTABLISHED</p>
                <p>> DOWNLOADING_ENV_DATA... 98%</p>
                <p>> GESTURE_RECOGNITION: {metrics.cpu > 25 ? 'OPTIMAL' : 'CALIBRATING'}</p>
             </div>
             <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80"></div>
        </div>
      </div>
      
      {/* Connecting Line to Face */}
      <svg className="absolute top-1/2 -left-20 w-20 h-20 -translate-y-1/2 pointer-events-none opacity-50 overflow-visible">
          <path d="M 80,40 L 40,40 L 0,80" fill="none" stroke="#22d3ee" strokeWidth="1" />
          <circle cx="0" cy="80" r="2" fill="#22d3ee" />
      </svg>
    </div>
  );
};

const MetricBar: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="flex items-center gap-2">
    <span className="text-[10px] text-cyan-400 font-bold w-6">{label}</span>
    <div className="flex-1 h-1 bg-cyan-900/50 rounded-full overflow-hidden">
      <div 
        className="h-full bg-cyan-400 shadow-[0_0_5px_rgba(34,211,238,0.8)]" 
        style={{ width: `${value}%` }}
      />
    </div>
  </div>
);
