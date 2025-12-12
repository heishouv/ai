import React, { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { mediaPipeService } from './services/mediapipeService';
import { SciFiGlobe } from './components/SciFiGlobe';
import { HUD } from './components/HUD';
import { DataStreamList } from './components/DataStreamList';
import { DebugConsole } from './components/DebugConsole';
import { LandmarkOverlay } from './components/LandmarkOverlay';
import { FaceData } from './types';

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const requestRef = useRef<number>();
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Tracking State
  const [faceData, setFaceData] = useState<FaceData | null>(null);
  const [rawFaceLandmarks, setRawFaceLandmarks] = useState<any[]>([]);
  const [rawHandLandmarks, setRawHandLandmarks] = useState<any[][]>([]);
  
  // Layout Metrics for correct overlay drawing
  const [layoutMetrics, setLayoutMetrics] = useState({ 
    renderWidth: 0, renderHeight: 0, offsetX: 0, offsetY: 0, screenWidth: 0 
  });

  // Globe State (Left Zone)
  const [globeRotation, setGlobeRotation] = useState({ x: 0, y: 0.1 }); 
  const [globeScale, setGlobeScale] = useState(1);
  
  // List State (Right Zone)
  const [listScroll, setListScroll] = useState(0);
  const listScrollRef = useRef(0);

  // Debug Logs
  const [logs, setLogs] = useState<string[]>([]);
  const frameCountRef = useRef(0);

  // Refs for gesture smoothing (Map of Hand Index -> Position)
  const lastHandPositions = useRef<Map<number, {x: number, y: number}>>(new Map());

  const addLog = (msg: string) => {
    setLogs(prev => {
        const newLogs = [...prev, msg];
        if (newLogs.length > 20) return newLogs.slice(newLogs.length - 20);
        return newLogs;
    });
  };

  useEffect(() => {
    const init = async () => {
      addLog("SYSTEM_BOOT_SEQUENCE_INITIATED...");
      await mediaPipeService.initialize();
      addLog("NEURAL_NET_LOADED: MEDIAPIPE_VISION_V0.1");
      startCamera();
    };
    init();

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  const startCamera = async () => {
    if (!videoRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 }, 
          height: { ideal: 720 },
          facingMode: 'user' 
        }
      });
      videoRef.current.srcObject = stream;
      videoRef.current.addEventListener('loadeddata', () => {
          addLog("CAMERA_FEED_ACQUIRED");
          setIsLoaded(true);
          predict();
      });
    } catch (err) {
      console.error("Error accessing webcam:", err);
      addLog("ERROR: CAMERA_ACCESS_DENIED");
    }
  };

  const predict = () => {
    if (!videoRef.current || !mediaPipeService.faceLandmarker || !mediaPipeService.handLandmarker) return;
    
    const now = performance.now();
    const video = videoRef.current;
    
    // Counter to throttle logs
    frameCountRef.current += 1;

    if (video.videoWidth > 0 && video.videoHeight > 0) {
      
      // --- Layout Calculation for Object-Cover ---
      const videoRatio = video.videoWidth / video.videoHeight;
      const screenRatio = window.innerWidth / window.innerHeight;
      let renderWidth, renderHeight, offsetX, offsetY;

      if (screenRatio > videoRatio) {
         renderWidth = window.innerWidth;
         renderHeight = window.innerWidth / videoRatio;
         offsetX = 0;
         offsetY = (window.innerHeight - renderHeight) / 2;
      } else {
         renderHeight = window.innerHeight;
         renderWidth = window.innerHeight * videoRatio;
         offsetX = (window.innerWidth - renderWidth) / 2;
         offsetY = 0;
      }
      
      // Update state sparingly (or use a ref if performance is hit, but state ensures overlay redraw)
      if (frameCountRef.current % 30 === 0) {
        setLayoutMetrics({ renderWidth, renderHeight, offsetX, offsetY, screenWidth: window.innerWidth });
      }

      // Helper to get screen coords for logic
      const toScreen = (p: {x: number, y: number}) => {
         const rx = p.x * renderWidth + offsetX;
         return {
            x: window.innerWidth - rx, // Mirrored X
            y: p.y * renderHeight + offsetY
         };
      };

      // 1. Detect Face
      const faceResult = mediaPipeService.faceLandmarker.detectForVideo(video, now);
      if (faceResult.faceLandmarks.length > 0) {
        const landmarks = faceResult.faceLandmarks[0];
        setRawFaceLandmarks(landmarks);
        
        // Pass normalized face data but we might need screen data for HUD? 
        // Current HUD uses percentage (0-100), which is fine if we stick to that abstraction, 
        // but using screen coords is more precise. Let's keep existing HUD logic for now 
        // but feed it better data if needed.
        setFaceData({
          position: { 
            x: landmarks[1].x, 
            y: landmarks[1].y, 
            z: landmarks[1].z 
          },
          tilt: 0
        });

        if (frameCountRef.current % 60 === 0) {
             addLog(`FACE_TRK: [${landmarks[1].x.toFixed(2)}, ${landmarks[1].y.toFixed(2)}]`);
        }
      } else {
        setFaceData(null);
        setRawFaceLandmarks([]);
      }

      // 2. Detect Hands
      const handResult = mediaPipeService.handLandmarker.detectForVideo(video, now);
      
      if (handResult.landmarks.length > 0) {
        setRawHandLandmarks(handResult.landmarks);
        
        // Iterate through all detected hands
        handResult.landmarks.forEach((landmarks, index) => {
            const thumbTip = landmarks[4];
            const indexTip = landmarks[8];
            const wrist = landmarks[0];
            
            const screenWrist = toScreen(wrist);
            
            // Interaction Zones (in Screen Pixels)
            const isLeftZone = screenWrist.x < window.innerWidth * 0.35; // Left 35%
            const isRightZone = screenWrist.x > window.innerWidth * 0.65; // Right 35% (Visual Right)

            // Pinch calculation
            // Note: Distance needs to be somewhat scale independent, or just use normalized
            const pinchDist = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);
            const isPinching = pinchDist < 0.08;

            const prevPos = lastHandPositions.current.get(index);

            if (prevPos) {
                const dx = screenWrist.x - prevPos.x;
                const dy = screenWrist.y - prevPos.y;

                if (isLeftZone) {
                    // Globe Control
                    if (isPinching) {
                        // Pinch to Scale
                        // Map delta Y to scale? Or just use pinch dist. 
                        // Using normalized pinch dist for scale is absolute.
                        // Let's use relative movement while pinching for smoother control
                        const scaleDelta = dy * -0.01; // Up increases scale
                        setGlobeScale(prev => Math.max(0.5, Math.min(3, prev + scaleDelta)));
                        
                        if (frameCountRef.current % 10 === 0) addLog(`CMD: SCALE >> ${scaleDelta > 0 ? '+' : ''}${scaleDelta.toFixed(3)}`);
                    } else {
                        // Rotate
                        setGlobeRotation(prev => ({
                            x: prev.x + dx * 0.005, // Pixel delta to rotation
                            y: prev.y + dy * 0.005
                        }));
                    }
                } 
                else if (isRightZone) {
                    // List Control
                    // Vertical movement scrolls
                    const scrollDelta = dy * 0.2; // Sensitivity
                    const newScroll = listScrollRef.current + scrollDelta;
                    listScrollRef.current = Math.max(0, Math.min(100, newScroll));
                    setListScroll(listScrollRef.current);
                    
                    if (Math.abs(dy) > 2 && frameCountRef.current % 5 === 0) {
                        addLog(`CMD: SCROLL >> ${Math.floor(listScrollRef.current)}%`);
                    }
                }
            }

            // Update tracker
            lastHandPositions.current.set(index, { x: screenWrist.x, y: screenWrist.y });
        });
        
        // Clean up old hands if fewer detected
        if (lastHandPositions.current.size > handResult.landmarks.length) {
            lastHandPositions.current.clear(); // Simple reset if count mismatches to avoid stale IDs
        }

      } else {
        setRawHandLandmarks([]);
        lastHandPositions.current.clear();
      }
    }

    requestRef.current = requestAnimationFrame(predict);
  };

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden">
      {/* Background Video Feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover transform -scale-x-100 opacity-60 filter contrast-125 brightness-75 grayscale-[0.3]" 
      />
      
      {/* Debug Overlay Layer (Canvas) */}
      <LandmarkOverlay 
         faceLandmarks={rawFaceLandmarks}
         handLandmarks={rawHandLandmarks}
         layout={layoutMetrics}
      />

      {/* Grid Overlay for Sci-Fi effect */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none"></div>
      
      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_50%,black_100%)] pointer-events-none"></div>

      {/* Loading State */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-50">
           <div className="text-cyan-400 font-mono animate-pulse">INITIALIZING J.A.R.V.I.S SYSTEMS...</div>
        </div>
      )}

      {/* 3D Scene Layer (Left Center) */}
      <div className="absolute top-1/2 left-[20%] -translate-y-1/2 -translate-x-1/2 w-[500px] h-[500px] z-10 pointer-events-none">
        <Canvas camera={{ position: [0, 0, 5], fov: 45 }} gl={{ alpha: true, antialias: true }}>
           <SciFiGlobe rotation={globeRotation} scale={globeScale} />
        </Canvas>
        <div className="absolute bottom-0 w-full text-center text-cyan-500/50 text-xs font-mono">
            GLOBAL SURVEILLANCE MODULE
        </div>
      </div>

      {/* Heads Up Display Layer */}
      <HUD faceData={faceData} />

      {/* Right Side Data List */}
      <DataStreamList scrollPos={listScroll} />

      {/* Debug Console (Bottom Left) */}
      <DebugConsole logs={logs} />
      
      <div className="absolute bottom-8 right-8 p-4 border-r-2 border-b-2 border-cyan-500/50 rounded-br-lg text-right z-20">
         <p className="text-cyan-400 font-mono text-sm">SYS: ONLINE</p>
         <p className="text-cyan-600 text-xs">V. 42.0.2 MULTI-THREAD</p>
      </div>

      {/* Top Left Static Title */}
      <div className="absolute top-8 left-8 p-4 border-l-2 border-t-2 border-cyan-500/50 rounded-tl-lg z-20">
         <h1 className="text-2xl font-bold text-cyan-400 tracking-widest">STARK INDUSTRIES</h1>
         <p className="text-xs text-cyan-600">MK. 85 DEBUG INTERFACE</p>
      </div>

      {/* Helper Text */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-cyan-600/60 text-xs font-mono">
         DUAL HAND TRACKING ENABLED
      </div>
    </div>
  );
}

export default App;