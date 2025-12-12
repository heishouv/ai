import React, { useEffect, useRef } from 'react';

interface LayoutMetrics {
  renderWidth: number;
  renderHeight: number;
  offsetX: number;
  offsetY: number;
  screenWidth: number;
}

interface LandmarkOverlayProps {
  faceLandmarks: any[]; 
  handLandmarks: any[][]; // Array of arrays for multiple hands
  layout: LayoutMetrics;
}

// Hand connections indices
const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8], // Index
  [0, 9], [9, 10], [10, 11], [11, 12], // Middle
  [0, 13], [13, 14], [14, 15], [15, 16], // Ring
  [0, 17], [17, 18], [18, 19], [19, 20] // Pinky
];

export const LandmarkOverlay: React.FC<LandmarkOverlayProps> = ({ faceLandmarks, handLandmarks, layout }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Use window dimensions for canvas
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Ensure canvas matches screen
    if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
    }

    ctx.clearRect(0, 0, width, height);

    const { renderWidth, renderHeight, offsetX, offsetY, screenWidth } = layout;

    // Helper to map normalized coordinates to screen space (accounting for object-cover and mirroring)
    const toScreen = (p: {x: number, y: number}) => {
        // Source X is mirrored visually: visual_x = screenWidth - (rendered_x)
        const rx = p.x * renderWidth + offsetX;
        const x = screenWidth - rx;
        const y = p.y * renderHeight + offsetY;
        return { x, y };
    }

    // --- DRAW FACE ---
    if (faceLandmarks && faceLandmarks.length > 0) {
      ctx.fillStyle = 'rgba(6, 182, 212, 0.6)'; // Cyan
      
      // Draw points
      faceLandmarks.forEach((point) => {
        const { x, y } = toScreen(point);
        ctx.fillRect(x, y, 1.5, 1.5);
      });

      // Draw bounding box
      let minX = width, maxX = 0, minY = height, maxY = 0;
      faceLandmarks.forEach(p => {
          const { x, y } = toScreen(p);
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
      });

      ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
      ctx.lineWidth = 1;
      ctx.strokeRect(minX - 10, minY - 10, (maxX - minX) + 20, (maxY - minY) + 20);
      
      // Label
      ctx.fillStyle = '#06b6d4';
      ctx.font = '12px Rajdhani';
      ctx.fillText(`ID_FACE_01 [${faceLandmarks[0].x.toFixed(2)}]`, minX, minY - 15);
    }

    // --- DRAW HANDS (Multiple) ---
    if (handLandmarks && handLandmarks.length > 0) {
      handLandmarks.forEach((landmarks, handIndex) => {
          const isRightVisual = toScreen(landmarks[0]).x > width / 2;
          const color = isRightVisual ? '#22c55e' : '#eab308'; // Green for Right Visual, Yellow for Left Visual (Example distinction)

          ctx.strokeStyle = color;
          ctx.fillStyle = color;
          ctx.lineWidth = 1.5;

          // Connections
          HAND_CONNECTIONS.forEach(([startIdx, endIdx]) => {
            const start = toScreen(landmarks[startIdx]);
            const end = toScreen(landmarks[endIdx]);
            
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();
          });

          // Points
          landmarks.forEach((point: any, index: number) => {
            const { x, y } = toScreen(point);
            
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, 2 * Math.PI);
            ctx.fill();

            if (index === 8) { // Index tip
                ctx.fillStyle = '#fff';
                ctx.font = '10px monospace';
                ctx.fillText(`H${handIndex}_IDX`, x + 10, y);
                ctx.fillStyle = color;
            }
          });
      });
    }

  }, [faceLandmarks, handLandmarks, layout]);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 w-full h-full pointer-events-none z-10"
    />
  );
};