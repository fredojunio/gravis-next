export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  images?: string[]; // Base64 strings
  groundingUrls?: Array<{ uri: string; title: string }>;
  isError?: boolean;
}

export enum AspectRatio {
  SQUARE = "1:1",
  PORTRAIT_2_3 = "2:3",
  LANDSCAPE_3_2 = "3:2",
  PORTRAIT_3_4 = "3:4",
  LANDSCAPE_4_3 = "4:3",
  PORTRAIT_9_16 = "9:16",
  LANDSCAPE_16_9 = "16:9",
  CINEMATIC_21_9 = "21:9"
}

export enum ImageSize {
  SIZE_1K = "1K",
  SIZE_2K = "2K",
  SIZE_4K = "4K"
}

export enum AppMode {
  ASSISTANT = 'assistant', // Chat & Prompting
  VISUALIZER = 'visualizer', // Text to Image
  RESTYLER = 'restyler', // Image to Image / Editing
  MEDIA = 'media' // Media Asset Library
}

export enum ModelTier {
  FLASH_2_5 = "Gemini 2.5 Flash",
  PRO_3 = "Gemini 3 Pro",
  GEMINI_3 = "Gemini 3",
  NANO_BANANA = "Nano Banana"
}

export interface MediaAsset {
  id: string;
  data: string; // Base64 string
  mimeType: string;
  prompt: string;
  timestamp: number;
  model: ModelTier;
  aspectRatio: AspectRatio;
  imageSize: ImageSize;
  sessionId?: string; // Link to chat session
  type: 'visualizer' | 'restyler';
}

export interface GeneratedImage {
  url: string;
  prompt: string;
  timestamp: number;
  }

// State Management Types

export interface BuilderData {
  task: string;
  reference: string;
  buildingType: string;
  archStyle: string[]; // Changed to string[] for multi-select
  archStyleCustom: string;
  roofMat: string;
  wallMat: string;
  groundMat: string;
  context: string;
  mood: string[]; // Changed to string[] for multi-select
  camera: string;
  view: string;
  focal: string;
  lens: string;
  dof: string;
}

export interface ChatSession {
  id: string;
  title: string;
  timestamp: number;
  messages: Message[];
  builderData: BuilderData;
}

export interface VisualizerState {
  prompt: string;
  aspectRatio: AspectRatio;
  imageSize: ImageSize;
  modelTier: ModelTier;
  generatedImage: string | null;
}

export interface RestylerState {
  baseImage: { data: string; mimeType: string; preview: string } | null;
  prompt: string;
  aspectRatio: AspectRatio;
  imageSize: ImageSize;
  modelTier: ModelTier;
  resultImage: string | null;
}
