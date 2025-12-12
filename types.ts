export interface Point {
  x: number;
  y: number;
  z: number;
}

export interface FaceData {
  position: Point; // Normalized 0-1
  tilt: number;
}

export interface GestureData {
  isPinching: boolean;
  pinchDistance: number;
  handPosition: Point;
}

export interface SystemMetrics {
  cpu: number;
  memory: number;
  network: number;
  power: number;
}
