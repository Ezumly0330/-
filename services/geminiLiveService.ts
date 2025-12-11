import { GoogleGenAI, LiveServerMessage, Modality, FunctionDeclaration, Type } from "@google/genai";

// Define the tool for the model to report hand state
const handControlTool: FunctionDeclaration = {
  name: 'updateHandState',
  parameters: {
    type: Type.OBJECT,
    description: 'Updates the simulation based on hand gesture analysis.',
    properties: {
      openness: {
        type: Type.NUMBER,
        description: 'A value between 0.0 and 1.0 representing how open the hand is. 0.0 is a closed fist, 1.0 is a fully open hand with fingers spread.',
      },
      handDetected: {
        type: Type.BOOLEAN,
        description: 'Set to true if a human hand is clearly visible in the frame. Set to false if no hand is visible or it is too blurry/far.',
      },
    },
    required: ['openness', 'handDetected'],
  },
};

export class GeminiLiveService {
  private client: GoogleGenAI;
  private session: any = null;
  private isConnected = false;
  private onStateUpdate: (data: { openness: number; handDetected: boolean }) => void;

  constructor(apiKey: string, onStateUpdate: (data: { openness: number; handDetected: boolean }) => void) {
    this.client = new GoogleGenAI({ apiKey });
    this.onStateUpdate = onStateUpdate;
  }

  async connect(videoElement: HTMLVideoElement) {
    if (this.isConnected) return;

    try {
      const sessionPromise = this.client.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            console.log('Gemini Live Session Opened');
            this.isConnected = true;
            this.startVideoLoop(videoElement, sessionPromise);
          },
          onmessage: (message: LiveServerMessage) => {
            this.handleMessage(message, sessionPromise);
          },
          onclose: () => {
            console.log('Gemini Live Session Closed');
            this.isConnected = false;
          },
          onerror: (err) => {
            console.error('Gemini Live Error', err);
            this.isConnected = false;
          }
        },
        config: {
          responseModalities: [Modality.AUDIO], // Required, even if we mostly want tool calls
          tools: [{ functionDeclarations: [handControlTool] }],
          systemInstruction: `
            You are a real-time gesture controller for a 3D simulation. 
            Continuously analyze the video input.
            Focus solely on the user's hand.
            
            1. DETECTION:
            - If you see a hand, set handDetected = true.
            - If no hand is visible, set handDetected = false and openness = 0.5.

            2. GESTURE (Only if handDetected is true):
            - If CLOSED FIST, set openness near 0.0.
            - If OPEN HAND (fingers spread), set openness near 1.0.
            - If relaxed, estimate between 0.0 and 1.0.
            
            Be extremely responsive and update frequently.
          `,
        },
      });
      
      this.session = await sessionPromise;
    } catch (error) {
      console.error("Connection failed:", error);
      throw error;
    }
  }

  private handleMessage(message: LiveServerMessage, sessionPromise: Promise<any>) {
    if (message.toolCall) {
      for (const fc of message.toolCall.functionCalls) {
        if (fc.name === 'updateHandState') {
          const args = fc.args as any;
          
          this.onStateUpdate({
            openness: typeof args.openness === 'number' ? args.openness : 0.5,
            handDetected: !!args.handDetected
          });
          
          // Acknowledge the tool call
          sessionPromise.then((session) => {
            session.sendToolResponse({
              functionResponses: {
                id: fc.id,
                name: fc.name,
                response: { result: "updated" },
              }
            });
          });
        }
      }
    }
  }

  private startVideoLoop(videoEl: HTMLVideoElement, sessionPromise: Promise<any>) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const FPS = 2; // Low FPS to save tokens, adequate for slow gesture changes
    
    const sendFrame = async () => {
      if (!this.isConnected || !videoEl) return;
      
      if (videoEl.readyState >= 2) {
        canvas.width = videoEl.videoWidth / 4; // Downscale for performance
        canvas.height = videoEl.videoHeight / 4;
        
        if (ctx) {
            ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
            const base64 = canvas.toDataURL('image/jpeg', 0.5).split(',')[1];
            
            sessionPromise.then(session => {
                session.sendRealtimeInput({
                    media: {
                        mimeType: 'image/jpeg',
                        data: base64
                    }
                });
            });
        }
      }
      setTimeout(sendFrame, 1000 / FPS);
    };

    sendFrame();
  }

  disconnect() {
    if (this.isConnected && this.session) {
       this.isConnected = false;
    }
  }
}