import React from 'react';
import { StarStage } from '../types';

interface UIOverlayProps {
  currentStage: StarStage;
  setStage: (stage: StarStage) => void;
  openness: number;
  isConnected: boolean;
  handDetected: boolean;
  onConnect: () => void;
  onFullscreen: () => void;
}

export const UIOverlay: React.FC<UIOverlayProps> = ({
  currentStage,
  setStage,
  openness,
  isConnected,
  handDetected,
  onConnect,
  onFullscreen
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-3 md:p-6">
      {/* Header */}
      <header className="flex justify-between items-start pointer-events-auto">
        <div className="bg-black/30 backdrop-blur-md p-2 md:p-4 rounded-lg border border-sky-500/30 shadow-[0_0_30px_rgba(14,165,233,0.1)]">
            <h1 className="text-xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-200 to-white tracking-wider">
              VFTS 352
            </h1>
            <p className="text-sky-400 text-[10px] md:text-xs uppercase tracking-[0.2em] mt-0.5 md:mt-1 font-semibold">
              The Kiss of Death
            </p>
        </div>

        <div className="flex gap-2 md:gap-4">
             {!isConnected && (
                <button 
                    onClick={onConnect}
                    className="bg-sky-600 hover:bg-sky-500 text-white text-xs md:text-base px-3 py-1.5 md:px-6 md:py-2 rounded-full font-semibold transition-all shadow-[0_0_20px_rgba(2,132,199,0.4)] hover:shadow-[0_0_30px_rgba(2,132,199,0.6)] whitespace-nowrap"
                >
                    <span className="hidden md:inline">Start AI Camera</span>
                    <span className="md:hidden">Start AI</span>
                </button>
            )}
            <button 
                onClick={onFullscreen}
                className="bg-slate-800/50 hover:bg-slate-700/50 text-sky-200 p-1.5 md:p-2 rounded-full border border-sky-500/30 transition-all backdrop-blur-sm"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                </svg>
            </button>
        </div>
      </header>

      {/* Right Sidebar Controls */}
      <div className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 pointer-events-auto flex flex-col gap-6">
        <div className="bg-black/40 backdrop-blur-xl p-2 md:p-3 rounded-xl md:rounded-2xl border border-sky-500/20 flex flex-col gap-2 md:gap-3 shadow-2xl">
            {Object.values(StarStage).map((stage) => (
                <button
                    key={stage}
                    onClick={() => setStage(stage)}
                    className={`
                        w-10 h-10 md:w-14 md:h-14 rounded-lg md:rounded-xl flex items-center justify-center transition-all duration-300 relative group
                        ${currentStage === stage ? 'bg-sky-500 text-white shadow-[0_0_20px_rgba(14,165,233,0.6)] scale-105' : 'bg-white/5 text-sky-400 hover:bg-white/10 hover:scale-105'}
                    `}
                >
                    <div className="hidden md:block absolute right-16 bg-black/90 px-3 py-1.5 rounded-lg text-xs font-bold text-sky-100 opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap pointer-events-none border border-sky-500/30 translate-x-2 group-hover:translate-x-0">
                        {stage}
                    </div>
                    
                    {/* Icons based on stage - Scaled down for mobile */}
                    {stage === StarStage.SEPARATED && (
                        <div className="flex gap-1 md:gap-1.5 items-center">
                            <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-current shadow-[0_0_5px_currentColor]"></div>
                            <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-current shadow-[0_0_5px_currentColor]"></div>
                        </div>
                    )}
                    {stage === StarStage.CONTACT && (
                        <div className="flex items-center transform scale-75 md:scale-100">
                             <div className="w-3 h-3 rounded-full bg-current -mr-1 blur-[0.5px]"></div>
                             <div className="w-3 h-3 rounded-full bg-current -ml-1 blur-[0.5px]"></div>
                        </div>
                    )}
                    {stage === StarStage.MERGED && (
                         <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-current shadow-[0_0_10px_currentColor] animate-pulse"></div>
                    )}
                    {stage === StarStage.BLACK_HOLE && (
                         <div className="relative w-4 h-4 md:w-6 md:h-6 flex items-center justify-center">
                            <div className="absolute inset-0 rounded-full border-2 border-current opacity-50"></div>
                            <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-black border border-current"></div>
                         </div>
                    )}
                </button>
            ))}
        </div>
      </div>

      {/* Footer Info (Left) */}
      <div className="pointer-events-auto w-full max-w-[220px] md:max-w-md">
          <div className="bg-black/30 backdrop-blur-xl p-3 md:p-5 rounded-xl border border-sky-500/20 text-sky-100 shadow-2xl">
              <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                  <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${isConnected ? 'bg-green-400 shadow-[0_0_8px_#4ade80] animate-pulse' : 'bg-red-500'}`}></div>
                  <span className="text-[10px] md:text-xs font-mono uppercase tracking-widest text-sky-300">
                    {isConnected ? 'Gesture Active' : 'Camera Offline'}
                  </span>
              </div>
              
              <div className="relative h-1 md:h-1.5 bg-slate-800 rounded-full overflow-hidden mb-1 md:mb-2">
                  <div 
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-sky-600 to-sky-300 transition-all duration-300 ease-out shadow-[0_0_10px_rgba(14,165,233,0.8)]"
                    style={{ width: `${openness * 100}%` }}
                  ></div>
              </div>
              
              <div className="flex justify-between text-[8px] md:text-[10px] text-sky-400/60 uppercase font-bold tracking-wider">
                  <span>Contract</span>
                  <span>Expand</span>
              </div>
          </div>
      </div>

      {/* Test System / Sensor Indicator (Bottom Right) */}
      <div className="absolute bottom-3 right-3 md:bottom-6 md:right-6 pointer-events-none">
        <div className={`
            flex items-center gap-2 md:gap-3 px-3 py-2 md:px-4 md:py-3 rounded-lg md:rounded-xl border backdrop-blur-md transition-all duration-500
            ${handDetected 
                ? 'bg-sky-500/20 border-sky-400 shadow-[0_0_30px_rgba(56,189,248,0.4)]' 
                : 'bg-black/40 border-white/10 grayscale opacity-60'}
        `}>
            {/* Visual Indicator */}
            <div className="relative w-3 h-3 md:w-4 md:h-4 flex items-center justify-center">
                 <div className={`
                    absolute inset-0 rounded-full transition-all duration-300
                    ${handDetected ? 'bg-sky-400 animate-ping opacity-75' : 'bg-transparent'}
                `}/>
                <div className={`
                    w-2 h-2 md:w-2.5 md:h-2.5 rounded-full transition-all duration-300 z-10
                    ${handDetected ? 'bg-sky-400 shadow-[0_0_10px_#38bdf8]' : 'bg-slate-600'}
                `}/>
            </div>
            
            <div className="flex flex-col">
                <span className="text-[9px] md:text-[10px] font-bold tracking-widest text-sky-100 uppercase leading-none mb-0.5 md:mb-1">
                    Sensor
                </span>
                <span className={`text-[8px] md:text-[9px] tracking-wider font-mono uppercase ${handDetected ? 'text-sky-300' : 'text-slate-500'}`}>
                    {handDetected ? 'Locked' : 'Scan...'}
                </span>
            </div>
        </div>
      </div>
    </div>
  );
};
