import React, { useState } from 'react';
import { MediaAsset } from '../types';

interface MediaLibraryPanelProps {
    assets: MediaAsset[];
    onDelete: (id: string) => void;
}

const MediaLibraryPanel: React.FC<MediaLibraryPanelProps> = ({ assets, onDelete }) => {
    const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);

    return (
        <div className="h-full flex flex-col p-6 bg-[#161a1d] overflow-hidden">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-[#edf2f4] mb-2">Media Assets</h2>
                <p className="text-[#edf2f4]/60 text-sm">Library of all generated architectural visualizations.</p>
            </div>

            <div className="flex-1 flex gap-6 overflow-hidden">
                {/* Grid */}
                <div className="flex-1 overflow-y-auto pr-2">
                    {assets.length === 0 ? (
                        <div className="h-64 flex flex-col items-center justify-center text-[#edf2f4]/40 border-2 border-dashed border-[#2d343a] rounded-2xl">
                            <p>No images generated yet.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {assets.sort((a, b) => b.timestamp - a.timestamp).map(asset => (
                                <div
                                    key={asset.id}
                                    onClick={() => setSelectedAsset(asset)}
                                    className={`group relative aspect-square bg-[#1e2327] rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${selectedAsset?.id === asset.id ? 'border-[#4137be]' : 'border-transparent hover:border-[#2d343a]'}`}
                                >
                                    <img
                                        src={`data:${asset.mimeType};base64,${asset.data}`}
                                        alt="Asset"
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                                        <span className="text-xs text-white font-medium truncate w-full">{new Date(asset.timestamp).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Details Sidebar */}
                {selectedAsset && (
                    <div className="w-80 bg-[#1e2327] border border-[#2d343a] rounded-2xl p-4 flex flex-col shrink-0 overflow-y-auto">
                        <div className="mb-4 rounded-xl overflow-hidden bg-[#161a1d] border border-[#2d343a]">
                            <img src={`data:${selectedAsset.mimeType};base64,${selectedAsset.data}`} alt="Detail" className="w-full h-auto" />
                        </div>

                        <div className="space-y-4 flex-1">
                            <div>
                                <h4 className="text-xs font-semibold text-[#edf2f4]/40 uppercase tracking-wider mb-1">Prompt</h4>
                                <p className="text-xs text-[#edf2f4]/80 bg-[#161a1d] p-2 rounded-lg max-h-32 overflow-y-auto">{selectedAsset.prompt}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <h4 className="text-xs font-semibold text-[#edf2f4]/40 uppercase tracking-wider mb-1">Model</h4>
                                    <p className="text-xs text-[#edf2f4]">{selectedAsset.model}</p>
                                </div>
                                <div>
                                    <h4 className="text-xs font-semibold text-[#edf2f4]/40 uppercase tracking-wider mb-1">Type</h4>
                                    <p className="text-xs text-[#edf2f4] capitalize">{selectedAsset.type}</p>
                                </div>
                                <div>
                                    <h4 className="text-xs font-semibold text-[#edf2f4]/40 uppercase tracking-wider mb-1">Resolution</h4>
                                    <p className="text-xs text-[#edf2f4]">{selectedAsset.imageSize || 'Native'}</p>
                                </div>
                                <div>
                                    <h4 className="text-xs font-semibold text-[#edf2f4]/40 uppercase tracking-wider mb-1">Aspect</h4>
                                    <p className="text-xs text-[#edf2f4]">{selectedAsset.aspectRatio}</p>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-xs font-semibold text-[#edf2f4]/40 uppercase tracking-wider mb-1">Created</h4>
                                <p className="text-xs text-[#edf2f4]">{new Date(selectedAsset.timestamp).toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="mt-6 flex gap-2">
                            <a
                                href={`data:${selectedAsset.mimeType};base64,${selectedAsset.data}`}
                                download={`gravis-${selectedAsset.timestamp}.png`}
                                className="flex-1 bg-[#4137be] hover:bg-[#322a9e] text-white text-xs font-bold py-3 rounded-xl text-center"
                            >
                                Download
                            </a>
                            <button
                                onClick={() => { onDelete(selectedAsset.id); setSelectedAsset(null); }}
                                className="px-4 bg-[#2d343a] hover:bg-red-900/50 hover:text-red-400 text-[#edf2f4]/80 text-xs font-bold rounded-xl"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MediaLibraryPanel;
