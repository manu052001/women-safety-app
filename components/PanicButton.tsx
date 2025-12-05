import React, { useState, useEffect, useRef } from 'react';
import { Bell, AlertTriangle, Shield, MapPin, Phone, Navigation, Video, Disc, Radio, Volume2, MessageSquare, Send, Mic, Cloud } from 'lucide-react';
import { AlertStatus, PoliceStation, Coordinates } from '../types';

interface PanicButtonProps {
  onTrigger: () => void;
  status: AlertStatus;
  onCancel: () => void;
  policeStation: PoliceStation | null;
  videoStream: MediaStream | null;
  sirenActive: boolean;
  whatsappLink?: string;
  smsLink?: string;
  voiceEnabled?: boolean;
  networkStats?: { ip: string, towerId: string } | null;
  currentLocation?: Coordinates | null;
}

export const PanicButton: React.FC<PanicButtonProps> = ({ 
    onTrigger, status, onCancel, policeStation, videoStream, sirenActive, whatsappLink, smsLink, voiceEnabled, networkStats, currentLocation
}) => {
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const holdDuration = 3000;
  const updateInterval = 20;

  useEffect(() => {
    if (videoStream && videoRef.current) {
      videoRef.current.srcObject = videoStream;
    }
  }, [videoStream, status]);

  const startHolding = () => {
    if (status !== AlertStatus.IDLE) return;
    if (navigator.vibrate) navigator.vibrate(50);

    const startTime = Date.now();
    intervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / holdDuration) * 100, 100);
      setProgress(newProgress);

      if (newProgress >= 100) {
        stopHolding();
        if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 500]);
        onTrigger();
      }
    }, updateInterval);
  };

  const stopHolding = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setProgress(0);
  };

  useEffect(() => {
    return () => stopHolding();
  }, []);

  if (status === AlertStatus.ACTIVE || status === AlertStatus.SENT) {
    return (
      <div className="w-full h-full flex flex-col bg-guardian-dark px-3 pt-2 pb-20 overflow-hidden">
        
        {/* Main Flex Container for One-Page View */}
        <div className="flex-1 flex flex-col gap-2 min-h-0">
            
            {/* 1. Status Header: Fixed Height */}
            <div className="shrink-0 h-14 bg-red-900/20 border border-red-500/50 px-3 rounded-xl flex items-center gap-3 relative overflow-hidden">
                <div className="absolute inset-0 bg-red-500/5 animate-pulse"></div>
                <div className="w-8 h-8 rounded-full bg-guardian-red flex items-center justify-center shadow-[0_0_15px_rgba(225,29,72,0.6)] shrink-0 z-10">
                    <AlertTriangle size={16} className="text-white" />
                </div>
                <div className="z-10 flex flex-col justify-center">
                    <h2 className="text-base font-bold text-white leading-none">SOS SENT</h2>
                    <p className="text-red-300 text-[10px] mt-0.5">Live Location & Video Shared</p>
                </div>
            </div>

            {/* 2. Video Feed: Flexible Height (Takes all remaining space) */}
            <div className="flex-1 relative bg-black rounded-xl overflow-hidden border border-gray-700 shadow-xl group min-h-[120px]">
                {videoStream ? (
                    <video 
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover transform scale-x-[-1]"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-900">
                        <Video size={32} className="text-gray-600" />
                    </div>
                )}
                
                {/* LIVE BROADCAST Overlay */}
                <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 shadow-sm z-20">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                    LIVE
                </div>

                {/* Cloud Sync Overlay */}
                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-blue-400 text-[10px] font-mono px-2 py-0.5 rounded border border-blue-500/30 flex items-center gap-1 shadow-sm z-20">
                    <Cloud size={10} className="animate-pulse" />
                    SYNCING...
                </div>

                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2 z-20">
                    <p className="text-[10px] text-gray-300 font-mono flex items-center gap-1">
                        <Disc size={10} className="animate-spin text-red-500" />
                        RECORDING EVIDENCE
                    </p>
                </div>
            </div>

            {/* 3. Action Grid: Fixed Height Row */}
            <div className="shrink-0 h-[72px] grid grid-cols-4 gap-2">
                
                {/* WhatsApp */}
                {whatsappLink ? (
                    <a 
                        href={whatsappLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-full bg-[#25D366] hover:bg-[#20bd5a] rounded-xl flex flex-col items-center justify-center p-1 transition-transform active:scale-95 shadow-lg"
                    >
                        <MessageSquare size={20} className="text-white mb-1" strokeWidth={2.5} />
                        <span className="text-white font-bold text-[10px]">WhatsApp</span>
                    </a>
                ) : (
                    <div className="h-full bg-gray-800 rounded-xl flex flex-col items-center justify-center opacity-50">
                         <MessageSquare size={20} className="text-gray-500 mb-1" />
                         <span className="text-gray-500 text-[10px]">N/A</span>
                    </div>
                )}

                {/* SMS */}
                {smsLink ? (
                    <a 
                        href={smsLink}
                        className="h-full bg-blue-600 hover:bg-blue-700 rounded-xl flex flex-col items-center justify-center p-1 transition-transform active:scale-95 shadow-lg"
                    >
                        <Send size={20} className="text-white mb-1" strokeWidth={2.5} />
                        <span className="text-white font-bold text-[10px]">SMS</span>
                    </a>
                ) : (
                     <div className="h-full bg-gray-800 rounded-xl flex flex-col items-center justify-center opacity-50">
                         <Send size={20} className="text-gray-500 mb-1" />
                         <span className="text-gray-500 text-[10px]">N/A</span>
                    </div>
                )}

                {/* Siren Status */}
                <div className={`h-full rounded-xl flex flex-col items-center justify-center p-1 border ${sirenActive ? 'bg-red-900/20 border-red-500/50 animate-pulse' : 'bg-gray-800 border-gray-700'}`}>
                    <Volume2 size={20} className={sirenActive ? "text-red-500 mb-1" : "text-gray-500 mb-1"} />
                    <span className="text-gray-400 text-[8px] font-medium uppercase">Siren</span>
                    <span className={`text-[10px] font-bold ${sirenActive ? 'text-red-500' : 'text-gray-500'}`}>
                        {sirenActive ? 'ON' : 'OFF'}
                    </span>
                </div>

                {/* Network Status - Updated to show IP and Tower Loc */}
                <div className="h-full bg-gray-800 border border-gray-700 rounded-xl flex flex-col items-center justify-center p-1 relative overflow-hidden text-center group">
                    <div className="flex items-center gap-1 mb-0.5">
                        <Radio size={14} className="text-green-500" />
                        <span className="text-green-500 text-[8px] font-bold">LINKED</span>
                    </div>

                    {networkStats ? (
                        <div className="flex flex-col items-center w-full overflow-hidden">
                             <span className="text-gray-300 text-[7px] font-mono leading-tight whitespace-nowrap">IP: {networkStats.ip}</span>
                             <span className="text-gray-400 text-[6px] font-mono leading-tight whitespace-nowrap mt-0.5">{networkStats.towerId}</span>
                             {currentLocation && (
                                <span className="text-gray-500 text-[6px] mt-0.5 leading-tight font-mono">
                                   Loc: {currentLocation.latitude.toFixed(2)},{currentLocation.longitude.toFixed(2)}
                                </span>
                             )}
                        </div>
                    ) : (
                        <>
                            <span className="text-gray-400 text-[8px] font-medium uppercase">Scanning...</span>
                            <div className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full animate-ping m-1"></div>
                        </>
                    )}
                </div>
            </div>

            {/* 4. Police Section: Auto Height (Compact) */}
            <div className="shrink-0 bg-gray-800/60 border border-gray-700 rounded-xl p-2">
                 <div className="flex items-center gap-2 mb-1.5">
                     <Shield className="text-blue-400" size={14} />
                     <span className="text-blue-100 font-bold text-[10px] uppercase">Nearest Police</span>
                 </div>
                 
                 {policeStation ? (
                    <div className="space-y-1.5">
                        <div>
                            <h3 className="text-white font-semibold text-xs leading-tight">{policeStation.name}</h3>
                            <p className="text-[10px] text-gray-400 line-clamp-1">{policeStation.address}</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                            <a 
                                href={`tel:${policeStation.phoneNumber?.replace(/\D/g,'') || '100'}`}
                                className="bg-red-600/90 hover:bg-red-600 text-white py-2 rounded-lg flex items-center justify-center gap-2 font-bold text-xs transition-colors"
                            >
                                <Phone size={14} /> Call
                            </a>
                            {policeStation.googleMapsUri && (
                                <a 
                                    href={policeStation.googleMapsUri} 
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-blue-600/90 hover:bg-blue-600 text-white py-2 rounded-lg flex items-center justify-center gap-2 font-bold text-xs transition-colors"
                                >
                                    <Navigation size={14} /> Map
                                </a>
                            )}
                        </div>
                    </div>
                 ) : (
                     <div className="h-14 flex flex-col items-center justify-center text-gray-500 text-[10px] animate-pulse">
                         <MapPin size={16} className="mb-1 opacity-50" />
                         Finding nearest station...
                     </div>
                 )}
            </div>

            {/* 5. Safe Button: Fixed Height */}
            <button 
                onClick={onCancel}
                className="shrink-0 h-12 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-bold text-sm tracking-wide transition-all active:scale-95 border border-gray-600"
            >
                I AM SAFE (STOP)
            </button>
            
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center relative flex-1">
       {/* Instruction Text */}
       <div className="absolute -top-16 text-gray-400 font-medium tracking-wide animate-pulse text-center w-full px-4 flex flex-col items-center gap-1">
          <span className="text-xs uppercase tracking-widest text-guardian-red font-bold">Press & Hold 3 Seconds</span>
          {voiceEnabled && (
              <div className="flex items-center gap-1.5 bg-gray-800/80 px-3 py-1 rounded-full border border-gray-700 shadow-lg mt-1">
                  <Mic size={12} className="text-white animate-pulse" />
                  <span className="text-[10px] text-white">Say "Help is needed"</span>
              </div>
          )}
       </div>

      <button
        onMouseDown={startHolding}
        onMouseUp={stopHolding}
        onMouseLeave={stopHolding}
        onTouchStart={startHolding}
        onTouchEnd={stopHolding}
        className="relative w-64 h-64 rounded-full bg-guardian-card shadow-2xl flex items-center justify-center group active:scale-95 transition-transform duration-200 border-4 border-gray-700 overflow-hidden"
      >
        <div 
          className="absolute bottom-0 left-0 right-0 bg-guardian-red transition-all duration-75 ease-linear"
          style={{ height: `${progress}%`, opacity: 0.9 }}
        />
        
        <div className="z-10 relative flex flex-col items-center pointer-events-none">
            <div className={`p-6 rounded-full bg-guardian-dark border-2 border-gray-600 group-active:border-guardian-red transition-colors duration-300`}>
                <Bell size={64} className={`text-white ${progress > 0 ? 'animate-shake' : ''}`} />
            </div>
            <span className="mt-4 text-xl font-bold text-white uppercase tracking-widest">SOS</span>
        </div>
        
        <div className="absolute inset-0 rounded-full border-4 border-guardian-red/20 scale-110 animate-ping-slow pointer-events-none"></div>
        <div className="absolute inset-0 rounded-full border-2 border-guardian-red/10 scale-125 animate-ping-slow pointer-events-none" style={{ animationDelay: '0.5s' }}></div>
      </button>

      <p className="mt-12 text-center text-gray-500 text-sm max-w-xs px-4">
        Keep app open. This screen will stay awake.
        <br/>Hold button or say <span className="text-white font-bold">"Help is needed"</span>.
      </p>
    </div>
  );
};