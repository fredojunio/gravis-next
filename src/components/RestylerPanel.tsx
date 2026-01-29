import React, { useState } from 'react';
import { editArchitecturalImage } from '../services/geminiService';
import { AspectRatio, ImageSize, MediaAsset, ModelTier, RestylerState } from '../types';

interface RestylerPanelProps {
    state: RestylerState;
    setState: (state: RestylerState) => void;
    // Context
    currentSessionId: string | null;
    onAssetCreated: (asset: MediaAsset) => void;
}

const RestylerPanel: React.FC<RestylerPanelProps> = ({ state, setState, currentSessionId, onAssetCreated }) => {
    const [isGenerating, setIsGenerating] = useState(false);

    const updateState = (updates: Partial<RestylerState>) => {
        setState({ ...state, ...updates });
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                updateState({
                    baseImage: {
                        data: base64String.split(',')[1],
                        mimeType: file.type,
                        preview: base64String
                    },
                    resultImage: null
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleEdit = async () => {
        if (!state.baseImage || !state.prompt) return;
        setIsGenerating(true);
        updateState({ resultImage: null });

        try {
            const response = await editArchitecturalImage(
                state.baseImage.data,
                state.baseImage.mimeType,
                state.prompt,
                state.aspectRatio,
                state.imageSize,
                state.modelTier
            );

            if (response.candidates?.[0]?.content?.parts) {
                for (const part of response.candidates?.[0]?.content?.parts || []) {
                    if (part.inlineData) {
                        const mime = part.inlineData.mimeType || 'image/png';
                        const base64Data = part.inlineData.data || '';
                        const fullDataUrl = `data:${mime};base64,${base64Data}`;

                        updateState({ resultImage: fullDataUrl });

                        // Save to Asset Library
                        const newAsset: MediaAsset = {
                            id: Date.now().toString(),
                            data: base64Data,
                            mimeType: mime,
                            prompt: state.prompt,
                            timestamp: Date.now(),
                            model: state.modelTier,
                            aspectRatio: state.aspectRatio,
                            imageSize: state.imageSize,
                            sessionId: currentSessionId || undefined,
                            type: 'restyler'
                        };
                        onAssetCreated(newAsset);

                        break;
                    }
                }
            } else {
                throw new Error("No image in response");
            }
        } catch (error) {
            alert("Failed to edit image. The request might have been blocked or the service is busy.");
            console.error(error);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="h-full flex flex-col p-6 bg-[#161a1d] overflow-y-auto">
            <div className="max-w-4xl mx-auto w-full space-y-8">
                {/* Header */}
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold text-[#edf2f4] mb-2">Restyler</h2>
                        <p className="text-[#edf2f4]/60 text-sm">Upload a sketch or render and modify it using text instructions.</p>
                    </div>
                    <div className="flex flex-col items-end">
                        <label className="text-xs text-[#edf2f4]/60 mb-1">AI Model</label>
                        <select
                            value={state.modelTier}
                            onChange={(e) => updateState({ modelTier: e.target.value as ModelTier })}
                            className="bg-[#1e2327] text-[#edf2f4] text-sm border border-[#2d343a] rounded-lg px-3 py-2 focus:ring-1 focus:ring-[#4137be] outline-none"
                        >
                            {Object.values(ModelTier).map(t => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Input Side */}
                    <div className="space-y-4">
                        <div className={`relative border-2 border-dashed ${state.baseImage ? 'border-[#4137be]' : 'border-[#2d343a]'} rounded-2xl h-80 flex flex-col items-center justify-center bg-[#1e2327] overflow-hidden group transition-all`}>
                            {state.baseImage ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={state.baseImage.preview} alt="Base" className="w-full h-full object-contain" />
                            ) : (
                                <div className="text-center p-6 pointer-events-none">
                                    <svg className="w-10 h-10 mx-auto text-[#edf2f4]/40 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                    <p className="text-[#edf2f4]/60 text-sm font-medium">Upload Base Image</p>
                                    <p className="text-[#edf2f4]/40 text-xs mt-1">JPEG or PNG</p>
                                </div>
                            )}
                            <input type="file" onChange={handleImageUpload} accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-[#edf2f4]/60 mb-2 uppercase tracking-wider">Instruction</label>
                            <input
                                type="text"
                                value={state.prompt}
                                onChange={(e) => updateState({ prompt: e.target.value })}
                                placeholder="e.g., 'Make it look like a brutalist concrete building', 'Add warm sunset lighting'"
                                className="w-full bg-[#1e2327] border border-[#2d343a] rounded-xl px-4 py-3 text-[#edf2f4] focus:outline-none focus:ring-2 focus:ring-[#4137be]"
                            />
                        </div>

                        {/* New Controls for Restyler */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-[#edf2f4]/60 mb-2 uppercase tracking-wider">Aspect Ratio</label>
                                <select
                                    value={state.aspectRatio}
                                    onChange={(e) => updateState({ aspectRatio: e.target.value as AspectRatio })}
                                    className="w-full bg-[#1e2327] border border-[#2d343a] rounded-lg p-3 text-[#edf2f4] focus:ring-2 focus:ring-[#4137be] outline-none"
                                >
                                    {Object.values(AspectRatio).map((ratio) => (
                                        <option key={ratio} value={ratio}>{ratio}</option>
                                    ))}
                                </select>
                            </div>
                            <div className={state.modelTier === ModelTier.FLASH_2_5 ? "opacity-50 pointer-events-none" : ""}>
                                <label className="block text-xs font-semibold text-[#edf2f4]/60 mb-2 uppercase tracking-wider">Resolution</label>
                                <select
                                    value={state.imageSize}
                                    onChange={(e) => updateState({ imageSize: e.target.value as ImageSize })}
                                    disabled={state.modelTier === ModelTier.FLASH_2_5}
                                    className="w-full bg-[#1e2327] border border-[#2d343a] rounded-lg p-3 text-[#edf2f4] focus:ring-2 focus:ring-[#4137be] outline-none"
                                >
                                    {Object.values(ImageSize).map((size) => (
                                        <option key={size} value={size}>{size}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <button
                            onClick={handleEdit}
                            disabled={!state.baseImage || !state.prompt || isGenerating}
                            className="w-full bg-[#4137be] hover:bg-[#322a9e] disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-medium shadow-lg shadow-[#4137be]/20 transition-all"
                        >
                            {isGenerating ? 'Processing...' : 'Generate Variation'}
                        </button>
                    </div>

                    {/* Output Side */}
                    <div className="space-y-4">
                        <div className="h-80 bg-[#1e2327] rounded-2xl border border-[#2d343a] flex items-center justify-center overflow-hidden">
                            {state.resultImage ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={state.resultImage} alt="Result" className="w-full h-full object-contain" />
                            ) : (
                                <div className="text-center text-[#edf2f4]/40">
                                    {isGenerating ? (
                                        <div className="animate-pulse">Generating new style...</div>
                                    ) : (
                                        <span>Result will appear here</span>
                                    )}
                                </div>
                            )}
                        </div>
                        {state.resultImage && (
                            <a href={state.resultImage} download="restyled-archigen.png" className="block w-full text-center bg-[#2d343a] hover:bg-[#3d454d] text-[#edf2f4] py-3 rounded-xl font-medium transition-all">
                                Download Result
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RestylerPanel;
