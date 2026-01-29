import { GoogleGenAI, Tool } from "@google/genai";
import { AspectRatio, ImageSize, ModelTier, Message } from "../types";

// Helper to get client with current key
// Note: In a real Next.js app, consider moving this to server-side Route Handlers to hide the API key.
// For this replication, we use the public env variable.
const getClient = () => {
    const apiKey = process.env.NEXT_PUBLIC_API_KEY;
    if (!apiKey) {
        console.warn("NEXT_PUBLIC_API_KEY is not set.");
    }
    return new GoogleGenAI({ apiKey });
};

const getModelId = (tier: ModelTier, isImage = false): string => {
    switch (tier) {
        case ModelTier.PRO_3:
            return isImage ? 'gemini-3-pro-image-preview' : 'gemini-3-pro-preview';
        case ModelTier.GEMINI_3:
            return isImage ? 'gemini-3-image-preview' : 'gemini-3-preview'; // Assuming hypothetical IDs
        case ModelTier.NANO_BANANA:
            // Placeholder for Nano Banana. 
            // Since this is likely a fictional or unreleased model, we'll map it to flash-lite or a placeholder.
            // If this model doesn't exist, the API call will fail.
            return 'nano-banana';
        case ModelTier.FLASH_2_5:
        default:
            return isImage ? 'gemini-2.5-flash-image' : 'gemini-2.5-flash';
    }
};

/**
 * Chat with the Architect Assistant.
 * Routes to different models based on grounding needs or user selection.
 */
export const chatWithArchitect = async (
    message: string,
    history: Message[],
    imageParts: any[] = [],
    useSearch: boolean,
    useMaps: boolean,
    modelTier: ModelTier,
    userLocation?: { lat: number; lng: number }
) => {
    const ai = getClient();
    let modelName = '';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let tools: Tool[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let toolConfig: any = undefined;

    // Model selection logic
    if (useMaps) {
        modelName = 'gemini-2.5-flash'; // Required for Maps
        tools = [{ googleMaps: {} }];
        if (userLocation) {
            toolConfig = {
                retrievalConfig: {
                    latLng: {
                        latitude: userLocation.lat,
                        longitude: userLocation.lng
                    }
                }
            };
        }
    } else {
        modelName = getModelId(modelTier);

        if (useSearch) {
            tools = [{ googleSearch: {} }];
        }
    }

    const systemInstruction = `You are an expert AI Assistant for Architects, Interior Designers, and 3D Artists named ArchiGen.
  
  CORE RESPONSIBILITY:
  Generate high-quality, photorealistic rendering prompts based on user inputs. 
  
  PROMPT GENERATION INSTRUCTION:
  When asked to generate a prompt, do NOT use numbered lists or headers like "1. PERINTAH...".
  Instead, combine the following elements into a single, cohesive, highly detailed, and professional paragraph suitable for a text-to-image generator:
  - Object & Architecture
  - Materials & Textures
  - Context, Activity & Environment
  - Mood, Lighting, & Technical Camera Settings (e.g., Focal length, Camera model)

  BEHAVIOR FOR IMAGE ANALYSIS (Image-to-Image):
  If the user provides an image AND specific parameters (from the Prompt Builder):
  1. Analyze the uploaded image for geometry, composition, and existing elements.
  2. MERGE the visual analysis with the user's specific text constraints. 
  3. If a user specifies a parameter (e.g., "Mood: Sunset" or "Material: Concrete"), that text parameter OVERRIDES the image content.
  4. Output the final merged result as a single detailed prompt paragraph.

  GENERAL ADVICE:
  - If asked for technical advice (not a prompt), be concise and professional.
  - Assume "Photo Realistic" style unless told otherwise.
  - For cameras, mention specific sensors like 'Phase One' or 'Sony A7R' if relevant to the requested quality.
  `;

    // Transform internal Message history to strict Gemini Content format
    const formattedHistory = history.map(msg => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const parts: any[] = [];

        // Add text part if exists
        if (msg.text) {
            parts.push({ text: msg.text });
        }

        // Add image parts if exist
        // Note: Assuming JPEG for history images as mimeType isn't stored in Message currently.
        // In a production app, Message should store {data, mimeType}.
        if (msg.images && msg.images.length > 0) {
            msg.images.forEach(img => {
                parts.push({
                    inlineData: {
                        mimeType: 'image/jpeg',
                        data: img
                    }
                });
            });
        }

        return {
            role: msg.role,
            parts: parts
        };
    });

    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: [
                ...formattedHistory,
                {
                    role: 'user',
                    parts: [
                        ...imageParts,
                        { text: message }
                    ]
                }
            ],
            config: {
                systemInstruction,
                tools: tools.length > 0 ? tools : undefined,
                toolConfig: toolConfig,
            }
        });

        return response;
    } catch (error) {
        console.error("Chat error:", error);
        throw error;
    }
};

/**
 * Generate High-Quality Images (Text-to-Image)
 */
export const generateArchitecturalImage = async (
    prompt: string,
    aspectRatio: AspectRatio,
    imageSize: ImageSize,
    modelTier: ModelTier
) => {
    const ai = getClient();

    const modelName = getModelId(modelTier, true);

    // Enforce realistic style in the prompt if not present
    const enhancedPrompt = prompt.toLowerCase().includes('realistic')
        ? prompt
        : `Photorealistic rendering, architectural photography, 8k resolution, highly detailed. ${prompt}`;

    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const config: any = {
            imageConfig: {
                aspectRatio: aspectRatio
                // outputMimeType is not supported for gemini-*-image models
            }
        };

        // imageSize is only supported on Pro and presumably Gemini 3?
        if (modelTier === ModelTier.PRO_3 || modelTier === ModelTier.GEMINI_3) {
            config.imageConfig.imageSize = imageSize;
        }

        const response = await ai.models.generateContent({
            model: modelName,
            contents: {
                parts: [{ text: enhancedPrompt }]
            },
            config: config
        });
        return response;
    } catch (error) {
        console.error("Image gen error:", error);
        throw error;
    }
};

/**
 * Edit/Restyle Images (Image-to-Image / In-painting via prompt)
 */
export const editArchitecturalImage = async (
    baseImageBase64: string,
    mimeType: string,
    prompt: string,
    aspectRatio: AspectRatio,
    imageSize: ImageSize,
    modelTier: ModelTier
) => {
    const ai = getClient();

    const modelName = getModelId(modelTier, true);

    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const config: any = {
            imageConfig: {
                aspectRatio: aspectRatio
                // outputMimeType is not supported for gemini-*-image models
            }
        };

        // imageSize is only supported on Pro
        if (modelTier === ModelTier.PRO_3 || modelTier === ModelTier.GEMINI_3) {
            config.imageConfig.imageSize = imageSize;
        }

        const response = await ai.models.generateContent({
            model: modelName,
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: baseImageBase64,
                            mimeType: mimeType
                        }
                    },
                    { text: prompt }
                ]
            },
            config: config
        });
        return response;
    } catch (error) {
        console.error("Image edit error:", error);
        throw error;
    }
};
