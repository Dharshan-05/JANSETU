import React from 'react';
import { 
  Radio, 
  BarChart3, 
  MapPin, 
  Layers, 
  EyeOff, 
  Cpu, 
  Sliders, 
  TrendingUp,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'foundation', label: 'Phase 1 Foundation', icon: ShieldCheck },
    { id: 'citizen', label: 'Citizen Voice', icon: Radio },
    { id: 'command-center', label: 'Command Center', icon: BarChart3 },
    { id: 'hotspots', label: 'Demand Hotspots', icon: MapPin },
    { id: 'shadow-map', label: 'Demand Shadow Map', icon: Layers },
    { id: 'silent-need', label: 'Silent Need Lab', icon: EyeOff },
    { id: 'digital-twin', label: 'Civic Digital Twin', icon: Cpu },
    { id: 'sandbox', label: 'Policy Sandbox', icon: Sliders },
    { id: 'impact', label: 'Impact Engine', icon: TrendingUp },
  ];

  return (
    <header className="border-b border-[#1E3E62] bg-[#0B192C]/95 backdrop-blur-md sticky top-0 z-50">
      {/* Top Sovereign Bar */}
      <div className="border-b border-[#1E3E62]/40 bg-[#070F1E] px-4 py-1.5 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center space-x-3">
          <div className="flex space-x-1 items-center">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF9933]"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-white"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#138808]"></span>
          </div>
          <span className="font-semibold text-slate-200 tracking-wider">
            GOVERNMENT OF INDIA • DIGITAL PUBLIC GOOD PILOT
          </span>
          <span className="text-[#FF9933] font-mono font-bold text-[10px] bg-[#FF9933]/10 px-2 py-0.5 rounded border border-[#FF9933]/30">
            CONFIDENTIAL CIVIC GRID
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-mono text-[11px]">BigQuery Vector Engine: ONLINE</span>
          </div>
          <div className="flex items-center space-x-1.5 text-purple-300 font-mono text-[11px] bg-purple-950/40 px-2 py-0.5 rounded border border-purple-800/40">
            <Sparkles className="w-3 h-3 text-purple-400" />
            <span>Google Gemini 2.5 Active</span>
          </div>
        </div>
      </div>

      {/* Main Header & Nav Tabs */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('command-center')}>
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#FF6500] to-[#E55604] flex items-center justify-center shadow-lg shadow-orange-500/20">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-extrabold tracking-tight text-white font-mono">JANSETU</span>
              <span className="text-[11px] bg-orange-500/20 text-[#FF9933] px-2 py-0.5 rounded font-mono font-bold">
                CIVIC INTELLIGENCE GRID
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              “Every Voice. Every Gap. One Intelligence Layer.”
            </p>
          </div>
        </div>

        {/* Navigation Pills */}
        <nav className="flex items-center space-x-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                  isActive
                    ? 'bg-[#FF6500] text-white shadow-md shadow-orange-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-[#1E3E62]/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
