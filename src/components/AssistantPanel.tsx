import React, { useState, useRef, useEffect } from 'react';
import { Message, ModelTier, BuilderData } from '../types';
import { chatWithArchitect } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

interface AssistantPanelProps {
    setGeneratedPrompt: (prompt: string) => void;
    switchToVisualizer: () => void;
    // Props lifted from state
    messages: Message[];
    setMessages: (messages: Message[]) => void;
    builderData: BuilderData;
    setBuilderData: (data: BuilderData) => void;
}

// Prompt Builder Options
const ARCH_STYLES = ['Contemporer', 'Minimalis', 'Modern', 'Tropical', 'Japandi', 'Scandinavian', 'Deconstruction', 'Futuristic', 'Other'];
const MOODS = ['Blue Hour', 'Morning low sun', 'Sunny bright day', 'Rainy day', 'Overcast', 'Golden hour', 'Sunset', 'Night', 'Midnight', 'Volumetric lighting sun'];
const CAMERAS = ['Phase One XF or IQ4', 'Hasselblad H6D or X2D', 'Fujifilm GFX 100 II', 'Arca-Swiss', 'Linhof', 'Sony A7R V', 'Canon EOS R5', 'Nikon Z9'];
const VIEWS = ['Eye level', "Bird's eye view", "Worm's eye view", 'Isometric view', 'Follow reference'];
const FOCAL_LENGTHS = ['Wide angle', '35mm', '50mm', '85mm', '200mm'];
const LENSES = ['Normal lens', 'Tilt shift lens'];

const AssistantPanel: React.FC<AssistantPanelProps> = ({
    setGeneratedPrompt,
    switchToVisualizer,
    messages,
    setMessages,
    builderData,
    setBuilderData
}) => {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [useSearch, setUseSearch] = useState(false);
    const [useMaps, setUseMaps] = useState(false);
    const [modelTier, setModelTier] = useState<ModelTier>(ModelTier.PRO_3);
    const [selectedImage, setSelectedImage] = useState<{ data: string, mimeType: string } | null>(null);

    // Prompt Builder Visibility
    const [showBuilder, setShowBuilder] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                const base64Data = base64String.split(',')[1];
                setSelectedImage({
                    data: base64Data,
                    mimeType: file.type
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const toggleArraySelection = (field: 'archStyle' | 'mood', value: string) => {
        const current = builderData[field];
        const updated = current.includes(value)
            ? current.filter(item => item !== value)
            : [...current, value];
        setBuilderData({ ...builderData, [field]: updated });
    };

    const constructPromptFromBuilder = () => {
        // Structure: [1. PERINTAH & OBJEK] + [2. MATERIAL & ARSITEKTUR] + [3. KONTEKS & AKTIVITAS] + [4. MOOD & TEKNIS]

        // Process Architecture styles
        let styles = [...builderData.archStyle];
        if (styles.includes('Other')) {
            styles = styles.filter(s => s !== 'Other');
            if (builderData.archStyleCustom) styles.push(builderData.archStyleCustom);
        }
        const styleFinal = styles.join(', ') || 'Modern';

        // Process Moods
        const moodFinal = builderData.mood.join(', ') || 'Sunny bright day';

        let explicitCommand = "";
        // Check if task is Image to Image or if the fixed style implies photorealistic intent for transformation
        if (builderData.task === 'Image to Image') {
            explicitCommand = "Turn this image to photorealistic. ";
        }

        // We send this structured data to the LLM to formalize
        return `
    Please generate a professional architectural prompt based on these specifications:
    
    1. TASK & OBJECT: ${explicitCommand}${builderData.task}, Building: ${builderData.buildingType || 'Unspecified'}
    2. MATERIAL & ARCHITECTURE: Style: Photo Realistic, Architecture: ${styleFinal}, Roof: ${builderData.roofMat}, Wall: ${builderData.wallMat}, Ground: ${builderData.groundMat}
    3. CONTEXT & ACTIVITY: Ref Type: ${builderData.reference}, Context: ${builderData.context}
    4. MOOD & TECHNICAL: Mood: ${moodFinal}, Camera: ${builderData.camera}, View: ${builderData.view}, Focal: ${builderData.focal}, Lens: ${builderData.lens}, DoF: ${builderData.dof}
    `;
    };

    const handleSend = async (overridePrompt?: string) => {
        const textToSend = overridePrompt || input;
        if ((!textToSend.trim() && !selectedImage) || isLoading) return;

        // If using builder and image is attached, we assume Image-to-Image analysis flow
        const isImageToImageFlow = showBuilder && selectedImage && builderData.task === 'Image to Image';

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            text: showBuilder ? "Generating prompt from Builder configuration..." : textToSend,
            images: selectedImage ? [selectedImage.data] : undefined
        };

        // Optimistically add user message for UI
        const newMessages = [...messages, userMsg];
        setMessages(newMessages);

        if (!showBuilder) setInput('');

        const imagePayload = selectedImage ? [{ inlineData: { data: selectedImage.data, mimeType: selectedImage.mimeType } }] : [];

        setSelectedImage(null);
        setIsLoading(true);

        try {
            let location = undefined;
            if (useMaps) {
                try {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject);
                    });
                    location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                } catch (e) {
                    console.warn("Geolocation failed", e);
                }
            }

            let finalPrompt = textToSend;
            if (isImageToImageFlow) {
                finalPrompt = `${textToSend}\n\nSYSTEM: The user has provided an image and specific Prompt Builder requirements. Analyze the image geometry/composition but enforce the Prompt Builder styles/materials/mood in the final output string.`;
            }

            // Important: Use 'messages' (current state before update) for history to avoid duplicating the user message we just added
            const recentHistory = messages.slice(-10); // Pass last 10 messages for context

            const response = await chatWithArchitect(
                finalPrompt,
                recentHistory,
                imagePayload,
                useSearch,
                useMaps,
                modelTier,
                location
            );

            const text = response.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't generate a response.";

            const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
            const urls: Array<{ uri: string, title: string }> = [];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            groundingChunks.forEach((chunk: any) => {
                if (chunk.web?.uri) urls.push({ uri: chunk.web.uri, title: chunk.web.title || chunk.web.uri });
                if (chunk.maps?.uri) urls.push({ uri: chunk.maps.uri, title: chunk.maps.title || "View on Google Maps" });
            });

            const modelMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'model',
                text: text,
                groundingUrls: urls
            };

            setMessages([...newMessages, modelMsg]);

        } catch (error) {
            setMessages([...newMessages, {
                id: Date.now().toString(),
                role: 'model',
                text: "I encountered an error processing your request. Please try again.",
                isError: true
            }]);
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const copyToPrompt = (text: string) => {
        setGeneratedPrompt(text);
        switchToVisualizer();
    };

    return (
        <div className="flex flex-col h-full bg-[#161a1d]">
            {/* Toolbar Header */}
            <div className="px-4 md:px-6 py-3 border-b border-[#2d343a] flex flex-row justify-between items-center bg-[#161a1d]/50 backdrop-blur z-10 gap-4">
                <div className="flex items-center gap-4">
                    <h2 className="text-[#edf2f4] font-semibold text-sm md:text-base">Architect Assistant</h2>
                    <button
                        onClick={() => setShowBuilder(!showBuilder)}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-colors whitespace-nowrap ${showBuilder ? 'bg-[#4137be] border-[#4137be] text-white' : 'bg-[#1e2327] border-[#2d343a] text-[#edf2f4]/70 hover:text-white'}`}
                    >
                        {showBuilder ? 'Close Builder' : 'Open Builder'}
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-[#edf2f4]/60 hidden md:inline">Model:</span>
                    <select
                        value={modelTier}
                        onChange={(e) => setModelTier(e.target.value as ModelTier)}
                        className="bg-[#1e2327] text-[#edf2f4] text-xs border border-[#2d343a] rounded-lg px-2 py-1 focus:ring-1 focus:ring-[#4137be] outline-none max-w-[100px] md:max-w-none"
                    >
                        {Object.values(ModelTier).map(t => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden relative">
                {/* Main Chat Area */}
                <div className="flex-1 flex flex-col min-w-0">
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[95%] md:max-w-[90%] rounded-2xl p-4 ${msg.role === 'user'
                                    ? 'bg-[#4137be] text-white shadow-md'
                                    : 'bg-[#1e2327] text-[#edf2f4] border border-[#2d343a]'
                                    }`}>
                                    {msg.images && msg.images.length > 0 && (
                                        <div className="mb-3">
                                            <span className="text-xs opacity-75 mb-1 block">Uploaded Reference:</span>
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={`data:image/jpeg;base64,${msg.images[0]}`} alt="User upload" className="max-h-48 rounded-lg border border-white/20" />
                                        </div>
                                    )}

                                    <div className="prose prose-invert prose-sm">
                                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                                    </div>

                                    {msg.groundingUrls && msg.groundingUrls.length > 0 && (
                                        <div className="mt-4 pt-3 border-t border-white/10">
                                            <p className="text-xs font-semibold text-[#edf2f4]/50 mb-2">Sources:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {msg.groundingUrls.map((url, idx) => (
                                                    <a
                                                        key={idx}
                                                        href={url.uri}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-xs bg-[#2d343a] hover:bg-[#3d454d] text-[#4137be] px-2 py-1 rounded transition-colors"
                                                    >
                                                        {url.title}
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {msg.role === 'model' && !msg.isError && (
                                        <button
                                            onClick={() => copyToPrompt(msg.text)}
                                            className="mt-3 text-xs flex items-center gap-1 text-[#fe5c24] hover:text-[#ff7847] font-medium"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                            Use as Generation Prompt
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-[#1e2327] rounded-2xl p-4 flex items-center gap-2">
                                    <div className="w-2 h-2 bg-[#4137be] rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-[#4137be] rounded-full animate-bounce delay-75"></div>
                                    <div className="w-2 h-2 bg-[#4137be] rounded-full animate-bounce delay-150"></div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 border-t border-[#2d343a] bg-[#161a1d]/95 backdrop-blur shrink-0">
                        {/* Tools Toggles */}
                        <div className="flex gap-4 mb-3 px-2">
                            <label className={`flex items-center gap-2 text-xs font-medium cursor-pointer transition-colors ${useSearch ? 'text-[#4137be]' : 'text-[#edf2f4]/50 hover:text-[#edf2f4]'}`}>
                                <input type="checkbox" checked={useSearch} onChange={e => { setUseSearch(e.target.checked); if (e.target.checked) setUseMaps(false); }} className="hidden" />
                                <span className={`w-4 h-4 rounded border flex items-center justify-center ${useSearch ? 'bg-[#4137be] border-[#4137be]' : 'border-[#2d343a]'}`}>
                                    {useSearch && <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>}
                                </span>
                                Google Search
                            </label>
                            <label className={`flex items-center gap-2 text-xs font-medium cursor-pointer transition-colors ${useMaps ? 'text-[#fe5c24]' : 'text-[#edf2f4]/50 hover:text-[#edf2f4]'}`}>
                                <input type="checkbox" checked={useMaps} onChange={e => { setUseMaps(e.target.checked); if (e.target.checked) setUseSearch(false); }} className="hidden" />
                                <span className={`w-4 h-4 rounded border flex items-center justify-center ${useMaps ? 'bg-[#fe5c24] border-[#fe5c24]' : 'border-[#2d343a]'}`}>
                                    {useMaps && <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>}
                                </span>
                                Maps <span className="text-[10px] opacity-60 ml-1 hidden md:inline">(Requires 2.5 Flash)</span>
                            </label>
                        </div>

                        {selectedImage && (
                            <div className="flex items-center gap-2 mb-2 bg-[#1e2327] p-2 rounded-lg w-fit border border-[#2d343a]">
                                <span className="text-xs text-[#edf2f4]">Image attached</span>
                                <button onClick={() => setSelectedImage(null)} className="text-[#edf2f4]/50 hover:text-[#fe5c24]">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        )}

                        <div className="flex gap-2">
                            <label className="p-3 text-[#edf2f4]/50 hover:text-[#4137be] cursor-pointer hover:bg-[#1e2327] rounded-xl transition-colors shrink-0">
                                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </label>
                            <input
                                type="text"
                                value={input}
                                disabled={showBuilder}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !showBuilder && handleSend()}
                                placeholder={showBuilder ? "Use builder..." : "Ask something..."}
                                className="flex-1 bg-[#1e2327] text-[#edf2f4] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#4137be] border border-[#2d343a] placeholder-[#edf2f4]/30 disabled:opacity-50 text-sm md:text-base min-w-0"
                            />
                            {showBuilder ? (
                                <button
                                    onClick={() => handleSend(constructPromptFromBuilder())}
                                    disabled={isLoading}
                                    className="bg-[#fe5c24] hover:bg-[#ff7847] disabled:opacity-50 text-white px-4 md:px-6 py-3 rounded-xl font-medium transition-all shadow-lg whitespace-nowrap text-sm md:text-base shrink-0"
                                >
                                    Generate
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleSend()}
                                    disabled={isLoading || (!input && !selectedImage)}
                                    className="bg-[#4137be] hover:bg-[#322a9e] disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 md:px-6 py-3 rounded-xl font-medium transition-all shadow-lg shadow-[#4137be]/20 text-sm md:text-base shrink-0"
                                >
                                    Send
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Builder Panel */}
                {showBuilder && (
                    <div className="fixed inset-0 z-50 md:static md:z-auto w-full md:w-80 bg-[#161a1d] border-l border-[#2d343a] overflow-y-auto p-4 space-y-6 shrink-0 shadow-2xl">
                        <div className="flex justify-between items-center md:hidden mb-4 border-b border-[#2d343a] pb-2">
                            <h3 className="text-sm font-bold text-[#edf2f4] uppercase tracking-wider">Configuration</h3>
                            <button onClick={() => setShowBuilder(false)} className="text-[#edf2f4] p-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <h3 className="text-sm font-bold text-[#edf2f4] uppercase tracking-wider mb-4 border-b border-[#2d343a] pb-2 hidden md:block">Prompt Configuration</h3>

                        {/* Section 1: Perintah & Objek */}
                        <div className="space-y-3">
                            <p className="text-xs font-semibold text-[#4137be]">1. PERINTAH & OBJEK</p>

                            <div className="space-y-1">
                                <label className="text-xs text-[#edf2f4]/60">Task</label>
                                <select
                                    value={builderData.task}
                                    onChange={(e) => setBuilderData({ ...builderData, task: e.target.value })}
                                    className="w-full bg-[#1e2327] border border-[#2d343a] text-[#edf2f4] text-xs rounded p-2 outline-none focus:border-[#4137be]"
                                >
                                    <option>Text to Image</option>
                                    <option>Image to Image</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-[#edf2f4]/60">Building Type</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Rumah, Gedung Publik"
                                    value={builderData.buildingType}
                                    onChange={(e) => setBuilderData({ ...builderData, buildingType: e.target.value })}
                                    className="w-full bg-[#1e2327] border border-[#2d343a] text-[#edf2f4] text-xs rounded p-2 outline-none focus:border-[#4137be]"
                                />
                            </div>
                        </div>

                        {/* Section 2: Material & Arsitektur */}
                        <div className="space-y-3 pt-2 border-t border-[#2d343a]">
                            <p className="text-xs font-semibold text-[#4137be]">2. MATERIAL & ARSITEKTUR</p>

                            <div className="space-y-1">
                                <label className="text-xs text-[#edf2f4]/60">Style</label>
                                <div className="text-xs text-[#edf2f4] bg-[#1e2327] p-2 rounded border border-[#2d343a]">Photo Realistic (Fixed)</div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs text-[#edf2f4]/60 mb-1 block">Architecture (Select multiple)</label>
                                <div className="flex flex-wrap gap-2">
                                    {ARCH_STYLES.map(style => (
                                        <button
                                            key={style}
                                            onClick={() => toggleArraySelection('archStyle', style)}
                                            className={`px-3 py-1 text-[10px] rounded-full border transition-all ${builderData.archStyle.includes(style)
                                                ? 'bg-[#4137be] border-[#4137be] text-white'
                                                : 'bg-[#1e2327] border-[#2d343a] text-[#edf2f4]/60 hover:border-[#4137be]/50'
                                                }`}
                                        >
                                            {style}
                                        </button>
                                    ))}
                                </div>
                                {builderData.archStyle.includes('Other') && (
                                    <input
                                        type="text"
                                        placeholder="Describe style..."
                                        value={builderData.archStyleCustom}
                                        onChange={(e) => setBuilderData({ ...builderData, archStyleCustom: e.target.value })}
                                        className="w-full mt-2 bg-[#1e2327] border border-[#2d343a] text-[#edf2f4] text-xs rounded p-2 outline-none focus:border-[#4137be]"
                                    />
                                )}
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs text-[#edf2f4]/60">Materials</label>
                                <input type="text" placeholder="Roof Material" value={builderData.roofMat} onChange={e => setBuilderData({ ...builderData, roofMat: e.target.value })} className="w-full mb-1 bg-[#1e2327] border border-[#2d343a] text-[#edf2f4] text-xs rounded p-2 outline-none focus:border-[#4137be]" />
                                <input type="text" placeholder="Wall Material" value={builderData.wallMat} onChange={e => setBuilderData({ ...builderData, wallMat: e.target.value })} className="w-full mb-1 bg-[#1e2327] border border-[#2d343a] text-[#edf2f4] text-xs rounded p-2 outline-none focus:border-[#4137be]" />
                                <input type="text" placeholder="Ground Material" value={builderData.groundMat} onChange={e => setBuilderData({ ...builderData, groundMat: e.target.value })} className="w-full bg-[#1e2327] border border-[#2d343a] text-[#edf2f4] text-xs rounded p-2 outline-none focus:border-[#4137be]" />
                            </div>
                        </div>

                        {/* Section 3: Konteks & Aktivitas */}
                        <div className="space-y-3 pt-2 border-t border-[#2d343a]">
                            <p className="text-xs font-semibold text-[#4137be]">3. KONTEKS & AKTIVITAS</p>
                            <div className="space-y-1">
                                <label className="text-xs text-[#edf2f4]/60">Reference Type</label>
                                <select
                                    value={builderData.reference}
                                    onChange={(e) => setBuilderData({ ...builderData, reference: e.target.value })}
                                    className="w-full bg-[#1e2327] border border-[#2d343a] text-[#edf2f4] text-xs rounded p-2 outline-none focus:border-[#4137be]"
                                >
                                    <option>3D Modelling Screenshot</option>
                                    <option>Photo Real</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-[#edf2f4]/60">Context & Activity</label>
                                <textarea
                                    rows={2}
                                    placeholder="Describe environment..."
                                    value={builderData.context}
                                    onChange={(e) => setBuilderData({ ...builderData, context: e.target.value })}
                                    className="w-full bg-[#1e2327] border border-[#2d343a] text-[#edf2f4] text-xs rounded p-2 outline-none focus:border-[#4137be] resize-none"
                                />
                            </div>
                        </div>

                        {/* Section 4: Mood & Teknis */}
                        <div className="space-y-3 pt-2 border-t border-[#2d343a]">
                            <p className="text-xs font-semibold text-[#4137be]">4. MOOD & TEKNIS</p>

                            <div className="space-y-1">
                                <label className="text-xs text-[#edf2f4]/60 mb-1 block">Mood Lighting (Select multiple)</label>
                                <div className="flex flex-wrap gap-2">
                                    {MOODS.map(mood => (
                                        <button
                                            key={mood}
                                            onClick={() => toggleArraySelection('mood', mood)}
                                            className={`px-3 py-1 text-[10px] rounded-full border transition-all ${builderData.mood.includes(mood)
                                                ? 'bg-[#4137be] border-[#4137be] text-white'
                                                : 'bg-[#1e2327] border-[#2d343a] text-[#edf2f4]/60 hover:border-[#4137be]/50'
                                                }`}
                                        >
                                            {mood}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs text-[#edf2f4]/60">Camera</label>
                                <select
                                    value={builderData.camera}
                                    onChange={(e) => setBuilderData({ ...builderData, camera: e.target.value })}
                                    className="w-full bg-[#1e2327] border border-[#2d343a] text-[#edf2f4] text-xs rounded p-2 outline-none focus:border-[#4137be]"
                                >
                                    {CAMERAS.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <label className="text-xs text-[#edf2f4]/60">View</label>
                                    <select value={builderData.view} onChange={(e) => setBuilderData({ ...builderData, view: e.target.value })} className="w-full bg-[#1e2327] border border-[#2d343a] text-[#edf2f4] text-xs rounded p-2 outline-none focus:border-[#4137be]">
                                        {VIEWS.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-[#edf2f4]/60">Focal Length</label>
                                    <select value={builderData.focal} onChange={(e) => setBuilderData({ ...builderData, focal: e.target.value })} className="w-full bg-[#1e2327] border border-[#2d343a] text-[#edf2f4] text-xs rounded p-2 outline-none focus:border-[#4137be]">
                                        {FOCAL_LENGTHS.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <label className="text-xs text-[#edf2f4]/60">Lens</label>
                                    <select value={builderData.lens} onChange={(e) => setBuilderData({ ...builderData, lens: e.target.value })} className="w-full bg-[#1e2327] border border-[#2d343a] text-[#edf2f4] text-xs rounded p-2 outline-none focus:border-[#4137be]">
                                        {LENSES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-[#edf2f4]/60">DoF</label>
                                    <select value={builderData.dof} onChange={(e) => setBuilderData({ ...builderData, dof: e.target.value })} className="w-full bg-[#1e2327] border border-[#2d343a] text-[#edf2f4] text-xs rounded p-2 outline-none focus:border-[#4137be]">
                                        <option>No</option>
                                        <option>Yes</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AssistantPanel;
