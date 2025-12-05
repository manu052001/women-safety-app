import React, { useState, useEffect, useRef } from 'react';
import { Volume2, PhoneIncoming, Mic, Square, PhoneOff, Video } from 'lucide-react';

interface ToolsProps {
  sirenActive: boolean;
  toggleSiren: () => void;
}

export const Tools: React.FC<ToolsProps> = ({ sirenActive, toggleSiren }) => {
  const [fakeCallActive, setFakeCallActive] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // --- Audio Recording Logic ---
  const toggleRecording = async () => {
    if (recording) {
      mediaRecorderRef.current?.stop();
      setRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            setRecordedChunks((prev) => [...prev, event.data]);
          }
        };

        mediaRecorder.start();
        setRecording(true);
      } catch (err) {
        console.error("Mic access denied", err);
        alert("Please enable microphone permissions to record evidence.");
      }
    }
  };

  // --- Fake Call UI ---
  if (fakeCallActive) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-between py-20 bg-[url('https://images.unsplash.com/photo-1555529902-5261145633bf?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center">
         <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
         
         <div className="z-10 flex flex-col items-center mt-12">
            <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center mb-6">
                <User size={48} className="text-gray-600" />
            </div>
            <h2 className="text-4xl text-white font-light">Dad</h2>
            <p className="text-gray-300 mt-2">Mobile</p>
         </div>

         <div className="z-10 w-full px-12 pb-12 flex justify-between items-end">
             <button 
                onClick={() => setFakeCallActive(false)}
                className="flex flex-col items-center gap-2"
             >
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center animate-bounce">
                    <PhoneOff size={32} className="text-white" />
                </div>
                <span className="text-white text-sm">Decline</span>
             </button>

             <button 
                onClick={() => setFakeCallActive(false)}
                className="flex flex-col items-center gap-2"
             >
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center animate-bounce delay-100">
                    <PhoneIncoming size={32} className="text-white" />
                </div>
                <span className="text-white text-sm">Accept</span>
             </button>
         </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 pb-24">
      <h2 className="text-2xl font-bold text-white mb-6">Safety Tools</h2>

      <div className="grid grid-cols-2 gap-4">
        {/* Siren Card */}
        <button
          onClick={toggleSiren}
          className={`col-span-1 p-6 rounded-2xl flex flex-col items-center justify-center gap-4 transition-all duration-300 border ${
            sirenActive 
              ? 'bg-red-600 border-red-500 shadow-[0_0_30px_rgba(220,38,38,0.5)] animate-pulse' 
              : 'bg-guardian-card border-gray-700 hover:bg-gray-800'
          }`}
        >
          <Volume2 size={40} className={sirenActive ? 'text-white' : 'text-guardian-red'} />
          <span className={`font-semibold ${sirenActive ? 'text-white' : 'text-gray-200'}`}>
            {sirenActive ? 'STOP SIREN' : 'Loud Siren'}
          </span>
        </button>

        {/* Fake Call Card */}
        <button
          onClick={() => setFakeCallActive(true)}
          className="col-span-1 p-6 rounded-2xl flex flex-col items-center justify-center gap-4 bg-guardian-card border border-gray-700 hover:bg-gray-800 transition-colors"
        >
          <PhoneIncoming size={40} className="text-blue-400" />
          <span className="font-semibold text-gray-200">Fake Call</span>
        </button>

        {/* Record Evidence Card */}
        <button
          onClick={toggleRecording}
          className={`col-span-2 p-6 rounded-2xl flex items-center justify-between px-8 gap-4 transition-all duration-300 border ${
            recording 
              ? 'bg-gray-800 border-red-500/50' 
              : 'bg-guardian-card border-gray-700 hover:bg-gray-800'
          }`}
        >
          <div className="flex items-center gap-4">
             <div className={`w-12 h-12 rounded-full flex items-center justify-center ${recording ? 'bg-red-500/20' : 'bg-gray-700'}`}>
                {recording ? <Square size={24} className="text-red-500 fill-current" /> : <Mic size={24} className="text-white" />}
             </div>
             <div className="text-left">
                <h3 className="font-semibold text-white">Record Audio</h3>
                <p className="text-xs text-gray-400">{recording ? 'Recording in progress...' : 'Capture evidence secretly'}</p>
             </div>
          </div>
          {recording && <div className="w-3 h-3 bg-red-500 rounded-full animate-ping"></div>}
        </button>
      </div>

       <div className="mt-6 bg-yellow-900/20 border border-yellow-700/50 p-4 rounded-xl">
           <div className="flex items-start gap-3">
               <Video className="text-yellow-500 mt-1 flex-shrink-0" size={20} />
               <div>
                   <h4 className="text-yellow-500 font-bold text-sm">Pro Tip</h4>
                   <p className="text-yellow-200/70 text-xs mt-1">Fake Call can help you exit uncomfortable situations gracefully. The Siren acts as a deterrent in lonely areas.</p>
               </div>
           </div>
       </div>
    </div>
  );
};

// Simple User Icon for Fake Call
function User(props: any) {
    return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
}