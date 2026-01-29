import React, { useState } from 'react';
import { AspectRatio, ImageSize, MediaAsset, ModelTier, VisualizerState } from '../types';
import { generateArchitecturalImage } from '../services/geminiService';

interface VisualizerPanelProps {
    initialPrompt: string;
    // State props
    state: VisualizerState;
    setState: (state: VisualizerState) => void;
    // Context
    currentSessionId: string | null;
    onAssetCreated: (asset: MediaAsset) => void;
}

const VisualizerPanel: React.FC<VisualizerPanelProps> = ({ initialPrompt, state, setState, currentSessionId, onAssetCreated }) => {
    const [isGenerating, setIsGenerating] = useState(false);

    // Update prompt if prop changes from assistant
    React.useEffect(() => {
        if (initialPrompt && initialPrompt !== state.prompt) {
            setState({ ...state, prompt: initialPrompt });
        }
    }, [initialPrompt]);

    const updateState = (updates: Partial<VisualizerState>) => {
        setState({ ...state, ...updates });
    };

    const handleGenerate = async () => {
        if (!state.prompt) return;
        setIsGenerating(true);
        updateState({ generatedImage: null });

        try {
            const response = await generateArchitecturalImage(state.prompt, state.aspectRatio, state.imageSize, state.modelTier);

            // Parse multi-part response to find image
            if (response.candidates?.[0]?.content?.parts) {
                for (const part of response.candidates?.[0]?.content?.parts || []) {
                    if (part.inlineData) {
                        const mime = part.inlineData.mimeType || 'image/png';
                        const base64Data = part.inlineData.data || '';
                        const fullDataUrl = `data:${mime};base64,${base64Data}`;

                        updateState({ generatedImage: fullDataUrl });

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
                            type: 'visualizer'
                        };
                        onAssetCreated(newAsset);

                        break;
                    }
                }
            }
        } catch (error) {
            alert("Failed to generate image. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="h-full flex flex-col p-6 bg-[#161a1d] overflow-y-auto">
            <div className="max-w-4xl mx-auto w-full space-y-6">

                {/* Header */}
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold text-[#edf2f4] mb-2">Visualizer</h2>
                        <p className="text-[#edf2f4]/60 text-sm">Create realistic architectural renders.</p>
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

                {/* Controls */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-[#edf2f4]/60 mb-2 uppercase tracking-wider">Prompt</label>
                            <textarea
                                value={state.prompt}
                                onChange={(e) => updateState({ prompt: e.target.value })}
                                className="w-full bg-[#1e2327] border border-[#2d343a] rounded-xl p-4 text-[#edf2f4] focus:ring-2 focus:ring-[#4137be] focus:outline-none min-h-[120px] resize-none"
                                placeholder="Describe your architectural vision in detail..."
                            />
                        </div>
                    </div>

                    <div className="space-y-6">
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
                            <label className="block text-xs font-semibold text-[#edf2f4]/60 mb-2 uppercase tracking-wider">
                                Resolution {state.modelTier === ModelTier.FLASH_2_5 && "(Pro Only)"}
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {Object.values(ImageSize).map((size) => (
                                    <button
                                        key={size}
                                        onClick={() => updateState({ imageSize: size })}
                                        disabled={state.modelTier === ModelTier.FLASH_2_5}
                                        className={`py-2 rounded-lg text-sm font-medium transition-all ${state.imageSize === size
                                            ? 'bg-[#4137be] text-[#edf2f4] shadow-lg shadow-[#4137be]/50'
                                            : 'bg-[#1e2327] text-[#edf2f4]/60 hover:bg-[#2d343a]'
                                            }`}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Removed bg-gradient-to-r and replaced with solid bg-[#4137be] */}
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating || !state.prompt}
                            className="w-full bg-[#4137be] hover:bg-[#322a9e] disabled:opacity-50 text-white py-4 rounded-xl font-bold shadow-xl shadow-[#4137be]/30 transition-all transform active:scale-95 flex items-center justify-center gap-2"
                        >
                            {isGenerating ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Rendering...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                                    Generate Render
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Output Area */}
                <div className="mt-8">
                    {state.generatedImage ? (
                        <div className="bg-[#1e2327] rounded-2xl p-2 border border-[#2d343a] shadow-2xl">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={state.generatedImage} alt="Generated Architectural Render" className="w-full h-auto rounded-xl" />
                            <div className="p-4 flex justify-between items-center">
                                <span className="text-[#edf2f4]/60 text-sm">Generated with {state.modelTier}</span>
                                <a href={state.generatedImage} download={`archigen-${Date.now()}.png`} className="text-[#4137be] hover:text-[#fe5c24] font-medium text-sm flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    Download
                                </a>
                            </div>
                        </div>
                    ) : (
                        <div className="h-64 border-2 border-dashed border-[#2d343a] rounded-2xl flex flex-col items-center justify-center text-[#edf2f4]/40">
                            <svg className="w-12 h-12 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            <p>Your generated visualization will appear here.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VisualizerPanel;
