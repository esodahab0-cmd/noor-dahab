export type AIProvider = "groq" | "gemini" | "cloudflare" | "huggingface";

export type AnalysisMode =
  | "general"
  | "read_text"
  | "currency"
  | "location"
  | "medication"
  | "faces"
  | "obstacle"
  | "colors"
  | "find_object"
  | "appliance"
  | "transit"
  | "barcode"
  | "companion";

export interface AIAnalysisRequest {
  imageBase64: string;
  mode?: AnalysisMode;
  locationInfo?: {
    latitude?: number;
    longitude?: number;
    addressText?: string;
  };
  customPrompt?: string;
  userQuestion?: string;
}

export interface AIAnalysisResponse {
  success: boolean;
  text: string;
  provider: AIProvider;
  latencyMs: number;
  error?: string;
  isFallback?: boolean;
  tierAttempted?: string[];
}

export interface AIKeysConfig {
  geminiKey?: string;
  groqKey?: string;
  cloudflareAccountId?: string;
  cloudflareApiToken?: string;
  huggingfaceKey?: string;
}