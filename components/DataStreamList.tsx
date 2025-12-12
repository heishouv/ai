import React from 'react';

interface DataItem {
  id: string;
  code: string;
  label: string;
  status: 'active' | 'pending' | 'warning' | 'error';
}

const DATA_ITEMS: DataItem[] = [
  { id: '1', code: 'SYS_CORE', label: 'Arc Reactor Output', status: 'active' },
  { id: '2', code: 'FLT_DYN', label: 'Flight Stabilizers', status: 'active' },
  { id: '3', code: 'WPN_SYS', label: 'Repulsor Charge', status: 'pending' },
  { id: '4', code: 'ENV_SCAN', label: 'Atmospheric Comp', status: 'active' },
  { id: '5', code: 'TRGT_LK', label: 'Targeting Array', status: 'warning' },
  { id: '6', code: 'COM_LNK', label: 'Satellite Uplink', status: 'active' },
  { id: '7', code: 'ARM_INT', label: 'Armor Integrity', status: 'error' },
  { id: '8', code: 'LIF_SUP', label: 'O2 Scrubbers', status: 'active' },
  { id: '9', code: 'PWR_GRD', label: 'Auxiliary Power', status: 'pending' },
  { id: '10', code: 'NAV_DAT', label: 'GPS Triangulation', status: 'active' },
  { id: '11', code: 'THR_REG', label: 'Thermal Regulation', status: 'active' },
  { id: '12', code: 'MEM_BNK', label: 'Memory Bank 42', status: 'active' },
];

interface DataStreamListProps {
  scrollPos: number; // 0 to 100
}

export const DataStreamList: React.FC<DataStreamListProps> = ({ scrollPos }) => {
  // Calculate total height needed for scroll simulation
  // We'll just shift the inner container based on percentage
  const translateY = -(scrollPos / 100) * (DATA_ITEMS.length * 60 - 400); // Approx calculation

  return (
    <div className="absolute top-1/2 right-8 -translate-y-1/2 w-80 h-[400px] overflow-hidden pointer-events-none z-20 flex flex-col">
      {/* List Header */}
      <div className="flex items-center justify-between border-b-2 border-cyan-500/50 pb-2 mb-2 bg-black/40 backdrop-blur-sm p-2">
        <span className="text-cyan-400 font-bold tracking-widest text-sm">DATA STREAM</span>
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-cyan-500/30 rounded-full"></div>
        </div>
      </div>

      {/* Scrollable Content Container */}
      <div className="relative flex-1 overflow-hidden mask-linear-gradient">
        <div 
          className="transition-transform duration-100 ease-out"
          style={{ transform: `translateY(${Math.min(translateY, 0)}px)` }}
        >
          {DATA_ITEMS.map((item) => (
            <div 
              key={item.id} 
              className="mb-2 p-3 border-l-2 border-cyan-500/20 bg-cyan-900/10 hover:bg-cyan-900/20 transition-colors backdrop-blur-sm"
            >
              <div className="flex justify-between items-center">
                <span className="text-cyan-300 font-mono text-xs">{item.code}</span>
                <StatusIndicator status={item.status} />
              </div>
              <div className="text-cyan-100 font-bold text-sm mt-1">{item.label}</div>
              <div className="w-full bg-cyan-900/30 h-0.5 mt-2 relative overflow-hidden">
                <div className="absolute inset-0 bg-cyan-400/50 w-2/3 animate-[shimmer_2s_infinite]"></div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Scrollbar Indicator */}
        <div className="absolute right-0 top-0 bottom-0 w-1 bg-cyan-900/30">
            <div 
                className="w-full bg-cyan-400 transition-all duration-100"
                style={{ 
                    height: `${(400 / (DATA_ITEMS.length * 70)) * 100}%`,
                    top: `${scrollPos}%` // Simplified mapping
                }}
            ></div>
        </div>
      </div>
      
      <div className="text-[10px] text-cyan-600 font-mono mt-1 text-right">
        SCROLL: R-HAND GESTURE
      </div>
    </div>
  );
};

const StatusIndicator: React.FC<{ status: DataItem['status'] }> = ({ status }) => {
    let colorClass = "bg-cyan-500";
    if (status === 'warning') colorClass = "bg-yellow-500";
    if (status === 'error') colorClass = "bg-red-500";
    if (status === 'pending') colorClass = "bg-gray-500";

    return (
        <div className={`px-2 py-0.5 rounded text-[9px] font-bold text-black ${colorClass}`}>
            {status.toUpperCase()}
        </div>
    )
}
