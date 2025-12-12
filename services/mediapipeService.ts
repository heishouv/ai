import { FilesetResolver, FaceLandmarker, HandLandmarker, DrawingUtils } from '@mediapipe/tasks-vision';

class MediaPipeService {
  private static instance: MediaPipeService;
  public faceLandmarker: FaceLandmarker | null = null;
  public handLandmarker: HandLandmarker | null = null;
  private isInitializing: boolean = false;

  private constructor() {}

  public static getInstance(): MediaPipeService {
    if (!MediaPipeService.instance) {
      MediaPipeService.instance = new MediaPipeService();
    }
    return MediaPipeService.instance;
  }

  public async initialize() {
    if (this.faceLandmarker && this.handLandmarker) return;
    if (this.isInitializing) return;

    this.isInitializing = true;

    try {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );

      this.faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
          delegate: "GPU"
        },
        outputFaceBlendshapes: true,
        runningMode: "VIDEO",
        numFaces: 1
      });

      this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numHands: 2
      });

      console.log("MediaPipe initialized successfully");
    } catch (error) {
      console.error("Failed to initialize MediaPipe:", error);
    } finally {
      this.isInitializing = false;
    }
  }
}

export const mediaPipeService = MediaPipeService.getInstance();