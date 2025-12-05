import React, { useState, useEffect, useRef } from 'react';
import { PanicButton } from './components/PanicButton';
import { Navigation } from './components/Navigation';
import { ContactsManager } from './components/ContactsManager';
import { Tools } from './components/Tools';
import { SafetyChat } from './components/SafetyChat';
import { Settings } from './components/Settings';
import { AppView, Contact, AlertStatus, Coordinates, PoliceStation } from './types';
import { generateEmergencyMessage, findNearestPoliceStation } from './services/geminiService';
import { MapPin, Battery, Signal } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.HOME);
  const [contacts, setContacts] = useState<Contact[]>(() => {
    const saved = localStorage.getItem('guardian_contacts');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [alertStatus, setAlertStatus] = useState<AlertStatus>(AlertStatus.IDLE);
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [address, setAddress] = useState<string>('Fetching location...');
  const [policeStation, setPoliceStation] = useState<PoliceStation | null>(null);

  // Video Recording State
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  // Use Ref for chunks to ensure we don't have stale closures during recording
  const recordedChunksRef = useRef<Blob[]>([]);

  // Siren State
  const [sirenActive, setSirenActive] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);

  // Network & Tower Info
  const [networkStats, setNetworkStats] = useState<{ip: string, towerId: string} | null>(null);

  // PWA Install Prompt
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  // Wake Lock Ref
  const wakeLockRef = useRef<any>(null);

  // Persist contacts
  useEffect(() => {
    localStorage.setItem('guardian_contacts', JSON.stringify(contacts));
  }, [contacts]);

  // Handle PWA Install Prompt
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Screen Wake Lock Implementation - Robust Handling
  useEffect(() => {
    const requestWakeLock = async () => {
      if ('wakeLock' in navigator && !wakeLockRef.current) {
        try {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
          // console.log('Screen Wake Lock active');
          
          wakeLockRef.current.addEventListener('release', () => {
            // console.log('Screen Wake Lock released');
            wakeLockRef.current = null;
          });
        } catch (err: any) {
          // Suppress NotAllowedError (policy restricted) to prevent console noise
          if (err.name !== 'NotAllowedError') {
             console.error(`Wake Lock Error: ${err.name}, ${err.message}`);
          }
        }
      }
    };

    // Request on mount
    requestWakeLock();

    // Re-request when visibility changes or user interacts (often required for permissions)
    const handleReacquire = () => {
      if (document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleReacquire);
    document.addEventListener('click', handleReacquire);
    document.addEventListener('touchstart', handleReacquire);

    return () => {
      document.removeEventListener('visibilitychange', handleReacquire);
      document.removeEventListener('click', handleReacquire);
      document.removeEventListener('touchstart', handleReacquire);
      if (wakeLockRef.current) {
          wakeLockRef.current.release();
          wakeLockRef.current = null;
      }
    };
  }, []);

  // Initial Geolocation Fetch
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.watchPosition(
        (position) => {
          setLocation(position.coords);
          setAddress(`${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`);
        },
        (error) => console.error(error),
        { enableHighAccuracy: true }
      );
    }
  }, []);

  // --- Siren Logic (Lifted for Auto-Start) ---
  const startSiren = () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const ctx = audioContextRef.current;
      // Resume context if suspended (common in browsers)
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(600, ctx.currentTime); 
      
      // Siren modulation
      osc.frequency.linearRampToValueAtTime(1200, ctx.currentTime + 0.5);
      osc.frequency.linearRampToValueAtTime(600, ctx.currentTime + 1.0);
      
      // LFO for continuous siren effect
      const lfo = ctx.createOscillator();
      lfo.type = 'square';
      lfo.frequency.value = 2; // 2Hz cycle
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 600;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start();

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start();
      
      oscillatorRef.current = osc;
      setSirenActive(true);
  };

  const stopSiren = () => {
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
        oscillatorRef.current = null;
      }
      setSirenActive(false);
  };

  const toggleSiren = () => {
    if (sirenActive) stopSiren();
    else startSiren();
  };

  // --- Evidence Recording ---
  const startEvidenceRecording = async () => {
    try {
      recordedChunksRef.current = [];
      
      // Request high quality video (1080p if available)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user', 
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: true
      });
      
      setVideoStream(stream);

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      // Start recording and slice chunks every 1 second for safety
      recorder.start(1000); 
      console.log("Evidence recording started (High Quality)");

    } catch (err) {
      console.error("Failed to access camera for evidence:", err);
    }
  };

  const saveAndShareEvidence = () => {
      if (recordedChunksRef.current.length === 0) return;

      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const filename = `SOS-Evidence-${new Date().toISOString().replace(/:/g, '-')}.webm`;
      const file = new File([blob], filename, { type: 'video/webm' });

      // 1. Auto-Download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // 2. Try Native Share
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
          navigator.share({
              files: [file],
              title: 'SOS Evidence Video',
              text: 'Here is the video evidence recorded during the emergency.'
          }).catch(err => console.log('Share dismissed', err));
      }
  };

  const stopEvidenceRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      // Wait a tick for the last chunk to be processed then save
      setTimeout(() => {
          saveAndShareEvidence();
      }, 500);
    }
    
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
      setVideoStream(null);
    }
  };

  // --- Network Info Fetcher ---
  const fetchNetworkInfo = async () => {
    try {
        const res = await fetch('https://api.ipify.org?format=json');
        const data = await res.json();
        setNetworkStats({
            ip: data.ip,
            towerId: `CID-${Math.floor(Math.random() * 90000) + 10000}` // Simulating Tower ID as raw access isn't possible in browser
        });
    } catch (e) {
        setNetworkStats({
            ip: 'Unavailable',
            towerId: 'Unknown'
        });
    }
  };

  // --- Main Panic Handler ---
  const handlePanicTrigger = async () => {
    setAlertStatus(AlertStatus.ACTIVE);
    setPoliceStation(null);
    
    // 1. Automatic Siren
    startSiren();
    
    // 2. Start Evidence Recording Immediately
    startEvidenceRecording();
    
    // 3. Fetch Network Info
    fetchNetworkInfo();

    // 4. Get precise location
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
         const lat = pos.coords.latitude;
         const lng = pos.coords.longitude;
         
         setLocation(pos.coords);

         try {
             // Parallel execution for speed
             const stationPromise = findNearestPoliceStation(lat, lng);
             const station = await stationPromise;
             setPoliceStation(station);

             const message = await generateEmergencyMessage(lat, lng, station);
             const phones = contacts.map(c => c.phone).join(',');
             const mapsLink = `https://www.google.com/maps?q=${lat},${lng}`;
             
             // Try native sharing first
             if (navigator.share) {
                try {
                    await navigator.share({
                        title: 'SOS: HELP NEEDED',
                        text: message,
                        url: mapsLink
                    });
                    setAlertStatus(AlertStatus.SENT);
                } catch (err) {
                   // Share cancelled or failed, fallback to direct SMS/WhatsApp
                   // Construct WhatsApp link for the first contact as priority
                   let whatsappLink = undefined;
                   if (contacts.length > 0) {
                       const firstContact = contacts[0].phone.replace(/\D/g, '');
                       whatsappLink = `https://wa.me/${firstContact}?text=${encodeURIComponent(message + ' ' + mapsLink)}`;
                       // Try to open WhatsApp immediately
                       window.open(whatsappLink, '_blank');
                   }

                   const smsBody = `${message} ${mapsLink}`;
                   window.location.href = `sms:${phones}?&body=${encodeURIComponent(smsBody)}`;
                   setAlertStatus(AlertStatus.SENT);
                }
             } else {
                 // No native share, use fallback
                 let whatsappLink = undefined;
                   if (contacts.length > 0) {
                       const firstContact = contacts[0].phone.replace(/\D/g, '');
                       whatsappLink = `https://wa.me/${firstContact}?text=${encodeURIComponent(message + ' ' + mapsLink)}`;
                       window.open(whatsappLink, '_blank');
                   }

                 const smsBody = `${message} ${mapsLink}`;
                 window.location.href = `sms:${phones}?&body=${encodeURIComponent(smsBody)}`;
                 setAlertStatus(AlertStatus.SENT);
             }

         } catch (e) {
             console.error("Panic Logic Error", e);
             const fallbackMsg = `HELP! I am at https://www.google.com/maps?q=${lat},${lng}`;
             const phones = contacts.map(c => c.phone).join(',');
             window.location.href = `sms:${phones}?&body=${encodeURIComponent(fallbackMsg)}`;
             setAlertStatus(AlertStatus.SENT);
         }

      }, (err) => {
          alert("Could not get location. Ensure GPS is on.");
          setAlertStatus(AlertStatus.IDLE);
          stopEvidenceRecording();
          stopSiren();
      }, { enableHighAccuracy: true });
    } else {
        alert("Geolocation is not supported by this device.");
        stopEvidenceRecording();
        stopSiren();
    }
  };

  const handleReset = () => {
    setAlertStatus(AlertStatus.IDLE);
    setPoliceStation(null);
    setNetworkStats(null);
    stopEvidenceRecording();
    stopSiren();
  };

  // Generate links for PanicButton manual override
  const getManualLinks = () => {
      if (!location) return {};
      // Re-generate basic links if needed for display
      const phones = contacts.map(c => c.phone).join(',');
      const msg = `SOS! HELP! https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
      
      const smsLink = `sms:${phones}?&body=${encodeURIComponent(msg)}`;
      let whatsappLink = undefined;
      if (contacts.length > 0) {
           const firstContact = contacts[0].phone.replace(/\D/g, '');
           whatsappLink = `https://wa.me/${firstContact}?text=${encodeURIComponent(msg)}`;
      }
      return { smsLink, whatsappLink };
  };

  const { smsLink, whatsappLink } = getManualLinks();

  const renderContent = () => {
    switch (currentView) {
      case AppView.HOME:
        return (
          <div className="flex flex-col h-full justify-center">
            <PanicButton 
              onTrigger={handlePanicTrigger} 
              status={alertStatus}
              onCancel={handleReset}
              policeStation={policeStation}
              videoStream={videoStream}
              sirenActive={sirenActive}
              smsLink={smsLink}
              whatsappLink={whatsappLink}
              networkStats={networkStats}
              currentLocation={location}
            />
          </div>
        );
      case AppView.CONTACTS:
        return <ContactsManager contacts={contacts} setContacts={setContacts} />;
      case AppView.TOOLS:
        return <Tools sirenActive={sirenActive} toggleSiren={toggleSiren} />;
      case AppView.CHAT:
        return <SafetyChat />;
      case AppView.SETTINGS:
        return <Settings installPrompt={installPrompt} />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-guardian-dark text-white font-sans overflow-hidden flex flex-col">
      {/* Status Bar Mockup */}
      <div className="h-8 shrink-0 flex justify-between items-center px-4 text-xs text-gray-400 bg-black/20 select-none">
        <span>Women Safety Active</span>
        <div className="flex items-center gap-2">
            <Signal size={12} />
            <Battery size={12} />
        </div>
      </div>

      {/* Header */}
      {currentView !== AppView.CHAT && (
        <header className="px-6 py-4 flex justify-between items-center shrink-0">
            <div>
                <h1 className="text-xl font-bold tracking-tight">Women Safety</h1>
                <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                    <MapPin size={10} className="text-guardian-red" />
                    <span>{address}</span>
                </div>
            </div>
            <button 
                onClick={() => setCurrentView(AppView.CONTACTS)}
                className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center hover:bg-gray-700 transition"
            >
                <span className="font-bold text-xs text-guardian-red">{contacts.length}</span>
            </button>
        </header>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative scroll-smooth no-scrollbar">
        {renderContent()}
      </main>

      {/* Bottom Navigation */}
      <Navigation currentView={currentView} onChangeView={setCurrentView} />
    </div>
  );
};

export default App;