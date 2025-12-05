import React, { useEffect, useState } from 'react';
import { Download, Shield, Smartphone, Info, Check, X, AlertTriangle } from 'lucide-react';

interface SettingsProps {
  installPrompt: any;
}

export const Settings: React.FC<SettingsProps> = ({ installPrompt }) => {
  const [permissions, setPermissions] = useState({
    geolocation: false,
    camera: false,
    microphone: false
  });

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    const geo = await navigator.permissions.query({ name: 'geolocation' });
    const cam = await navigator.permissions.query({ name: 'camera' as any });
    const mic = await navigator.permissions.query({ name: 'microphone' as any });

    setPermissions({
      geolocation: geo.state === 'granted',
      camera: cam.state === 'granted',
      microphone: mic.state === 'granted'
    });
  };

  const handleInstallClick = () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    installPrompt.userChoice.then((choiceResult: any) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      }
      // Clear the prompt variable as it can only be used once
    });
  };

  return (
    <div className="p-6 space-y-6 pb-24">
      <h2 className="text-2xl font-bold text-white mb-2">Settings</h2>
      
      {/* Install App Section */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 p-6 rounded-2xl border border-blue-700 shadow-lg">
        <div className="flex items-start justify-between">
            <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Smartphone size={20} />
                    Install App
                </h3>
                <p className="text-blue-200 text-sm mt-1">
                    Add to your home screen for quick access and offline support.
                </p>
            </div>
        </div>
        
        {installPrompt ? (
            <button 
                onClick={handleInstallClick}
                className="mt-4 w-full bg-white text-blue-900 font-bold py-3 rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
            >
                <Download size={18} />
                Install Application
            </button>
        ) : (
             <div className="mt-4 bg-blue-950/50 p-3 rounded-lg border border-blue-800">
                <p className="text-xs text-blue-300">
                    <Info size={12} className="inline mr-1" />
                    If using Chrome on Android, tap the browser menu (⋮) and select <b>"Add to Home Screen"</b> to install manually.
                </p>
             </div>
        )}
      </div>

       {/* Native Locked Screen SOS Guide */}
       <div className="bg-gradient-to-r from-red-900/40 to-red-800/40 p-6 rounded-2xl border border-red-800/50">
           <h3 className="text-lg font-bold text-white flex items-center gap-2">
               <AlertTriangle size={20} className="text-red-500" />
               Locked Screen SOS
           </h3>
           <p className="text-gray-300 text-sm mt-2">
               Web apps cannot detect power button presses when locked. For safety when the screen is off, please enable your phone's native feature:
           </p>
           <ol className="list-decimal list-inside text-xs text-gray-400 mt-3 space-y-1 bg-black/20 p-3 rounded-lg border border-red-900/30">
               <li>Open phone <b>Settings</b></li>
               <li>Go to <b>Safety & Emergency</b></li>
               <li>Select <b>Emergency SOS</b></li>
               <li>Turn on <b>"Use Emergency SOS"</b></li>
               <li className="text-red-300 font-semibold mt-1">Press Power Button 5 times to trigger</li>
           </ol>
       </div>

      {/* Permissions Status */}
      <div className="bg-guardian-card p-6 rounded-2xl border border-gray-700">
         <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
             <Shield size={20} className="text-guardian-red" />
             System Permissions
         </h3>
         
         <div className="space-y-4">
             <PermissionRow 
                label="Location Access" 
                enabled={permissions.geolocation} 
                desc="Required for SOS tracking & Police search."
             />
             <PermissionRow 
                label="Camera Access" 
                enabled={permissions.camera} 
                desc="Required for evidence recording."
             />
             <PermissionRow 
                label="Microphone Access" 
                enabled={permissions.microphone} 
                desc="Required for siren & audio recording."
             />
         </div>
      </div>

      <div className="text-center text-gray-500 text-xs mt-8">
          <p>Women Safety App v1.0.0</p>
          <p className="mt-1">Designed for rapid emergency response.</p>
      </div>
    </div>
  );
};

const PermissionRow = ({ label, enabled, desc }: { label: string, enabled: boolean, desc: string }) => (
    <div className="flex items-center justify-between py-2 border-b border-gray-700/50 last:border-0">
        <div>
            <p className="font-medium text-gray-200">{label}</p>
            <p className="text-[10px] text-gray-500">{desc}</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${enabled ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
            {enabled ? <Check size={12} /> : <X size={12} />}
            {enabled ? 'GRANTED' : 'DENIED'}
        </div>
    </div>
);