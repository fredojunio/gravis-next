'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import AssistantPanel from '@/components/AssistantPanel';
import VisualizerPanel from '@/components/VisualizerPanel';
import RestylerPanel from '@/components/RestylerPanel';
import MediaLibraryPanel from '@/components/MediaLibraryPanel';
import { AppMode, ChatSession, VisualizerState, RestylerState, AspectRatio, ImageSize, ModelTier, BuilderData, Message, MediaAsset } from '@/types';
import { getChatSessions, createChatSession, addMessageToSession, deleteChatSession, saveBuilderData, updateSessionTitle } from '@/lib/actions/chatActions';

// Default State Initializers
const DEFAULT_BUILDER_DATA: BuilderData = {
  task: 'Text to Image', reference: 'Photo Real', buildingType: '',
  archStyle: ['Modern'], // Initialized as array
  archStyleCustom: '', roofMat: '', wallMat: '', groundMat: '', context: '',
  mood: ['Sunny bright day'], // Initialized as array
  camera: 'Sony A7R V', view: 'Eye level', focal: '35mm',
  lens: 'Normal lens', dof: 'No'
};

const DEFAULT_VISUALIZER_STATE: VisualizerState = {
  prompt: '',
  aspectRatio: AspectRatio.LANDSCAPE_16_9,
  imageSize: ImageSize.SIZE_1K,
  modelTier: ModelTier.PRO_3,
  generatedImage: null
};

const DEFAULT_RESTYLER_STATE: RestylerState = {
  baseImage: null,
  prompt: '',
  aspectRatio: AspectRatio.LANDSCAPE_16_9,
  imageSize: ImageSize.SIZE_1K,
  modelTier: ModelTier.FLASH_2_5,
  resultImage: null
};

export default function Home() {
  const [currentMode, setCurrentMode] = useState<AppMode>(AppMode.ASSISTANT);

  // --- Global Application State ---
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [visualizerState, setVisualizerState] = useState<VisualizerState>(DEFAULT_VISUALIZER_STATE);
  const [restylerState, setRestylerState] = useState<RestylerState>(DEFAULT_RESTYLER_STATE);
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load sessions from DB on mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const dbSessions = await getChatSessions();
        setSessions(dbSessions);

        const savedVis = localStorage.getItem('gravis_vis_state');
        const savedRes = localStorage.getItem('gravis_res_state');
        const savedAssets = localStorage.getItem('gravis_media_assets');
        const savedSessionId = localStorage.getItem('gravis_current_session_id');

        if (savedVis) setVisualizerState(JSON.parse(savedVis));
        if (savedRes) setRestylerState(JSON.parse(savedRes));
        if (savedAssets) setMediaAssets(JSON.parse(savedAssets));

        if (dbSessions.length > 0) {
          if (savedSessionId && dbSessions.some((s: ChatSession) => s.id === savedSessionId)) {
            setCurrentSessionId(savedSessionId);
          } else {
            setCurrentSessionId(dbSessions[0].id);
          }
        }
      } catch (e) {
        console.error("Failed to load initial data", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialData();
  }, []);

  // Save UI states only to local storage (or you can move these to DB too later)

  useEffect(() => {
    localStorage.setItem('gravis_vis_state', JSON.stringify(visualizerState));
  }, [visualizerState]);

  useEffect(() => {
    localStorage.setItem('gravis_res_state', JSON.stringify(restylerState));
  }, [restylerState]);

  useEffect(() => {
    localStorage.setItem('gravis_media_assets', JSON.stringify(mediaAssets));
  }, [mediaAssets]);

  useEffect(() => {
    if (currentSessionId) localStorage.setItem('gravis_current_session_id', currentSessionId);
  }, [currentSessionId]);

  // Ensure a session exists
  useEffect(() => {
    if (isLoading) return; // Wait for initial load

    if (sessions.length === 0) {
      handleNewChat();
    } else if (sessions.length > 0 && !currentSessionId) {
      setCurrentSessionId(sessions[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, sessions.length, currentSessionId]);

  // Session Management
  const handleNewChat = async () => {
    const title = `Chat ${new Date().toLocaleTimeString()}`;
    const initialMessage: Message = {
      id: 'welcome-' + Date.now(),
      role: 'model',
      text: "Hello! I'm your AI Architectural Assistant. I can help you brainstorm concepts, find design references, or create detailed prompts for rendering. How can I help you today?"
    };

    try {
      const sessionId = await createChatSession(title, DEFAULT_BUILDER_DATA);
      await addMessageToSession(sessionId, initialMessage);

      const newSession: ChatSession = {
        id: sessionId,
        title,
        timestamp: Date.now(),
        messages: [initialMessage],
        builderData: { ...DEFAULT_BUILDER_DATA }
      };

      setSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(sessionId);
      setCurrentMode(AppMode.ASSISTANT);
    } catch (e) {
      console.error("Failed to create new chat", e);
    }
  };

  const handleDeleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await deleteChatSession(id);
      const newSessions = sessions.filter(s => s.id !== id);
      setSessions(newSessions);
      if (currentSessionId === id) {
        setCurrentSessionId(newSessions.length > 0 ? newSessions[0].id : null);
      }
    } catch (e) {
      console.error("Failed to delete session", e);
    }
  };

  const updateCurrentSession = async (updatedMessages: Message[], updatedBuilder?: BuilderData) => {
    if (!currentSessionId) return;

    // Find if we need to update title
    const sessionToUpdate = sessions.find(s => s.id === currentSessionId);
    if (!sessionToUpdate) return;

    let newTitle = sessionToUpdate.title;
    const isNewMessage = updatedMessages.length > sessionToUpdate.messages.length;

    if (sessionToUpdate.messages.length <= 1 && updatedMessages.length > 1) {
      const firstUserMsg = updatedMessages.find(m => m.role === 'user');
      if (firstUserMsg) {
        newTitle = firstUserMsg.text.slice(0, 30) + (firstUserMsg.text.length > 30 ? '...' : '');
      }
    }

    // Optimistic update
    setSessions(prev => prev.map((s: ChatSession) => {
      if (s.id === currentSessionId) {
        return {
          ...s,
          messages: updatedMessages,
          builderData: updatedBuilder || s.builderData,
          title: newTitle,
          timestamp: Date.now()
        };
      }
      return s;
    }));

    // Async DB update
    try {
      if (updatedBuilder) {
        await saveBuilderData(currentSessionId, updatedBuilder);
      }
      if (isNewMessage) {
        const lastMsg = updatedMessages[updatedMessages.length - 1];
        await addMessageToSession(currentSessionId, lastMsg);
      }
      if (newTitle !== sessionToUpdate.title) {
        await updateSessionTitle(currentSessionId, newTitle);
      }
    } catch (e) {
      console.error("Failed to sync session to DB", e);
    }
  };

  const handleAddMediaAsset = (asset: MediaAsset) => {
    setMediaAssets(prev => [asset, ...prev]);
  };

  const handleDeleteMediaAsset = (id: string) => {
    setMediaAssets(prev => prev.filter(a => a.id !== id));
  };

  const currentSession = sessions.find(s => s.id === currentSessionId);

  // Handlers for child components
  const handleSetGeneratedPrompt = (prompt: string) => {
    setVisualizerState(prev => ({ ...prev, prompt }));
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full bg-[#161a1d] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="text-white/40 text-sm font-medium tracking-widest uppercase">Initializing Canvas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-[#161a1d] overflow-hidden font-sans">
      <Sidebar
        currentMode={currentMode}
        setMode={setCurrentMode}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onNewChat={handleNewChat}
        onSelectSession={(id) => { setCurrentSessionId(id); setCurrentMode(AppMode.ASSISTANT); }}
        onDeleteSession={handleDeleteSession}
      />

      <main className="flex-1 h-full overflow-hidden relative">
        {currentMode === AppMode.ASSISTANT && currentSession && (
          <AssistantPanel
            setGeneratedPrompt={handleSetGeneratedPrompt}
            switchToVisualizer={() => setCurrentMode(AppMode.VISUALIZER)}
            messages={currentSession.messages}
            setMessages={(msgs) => updateCurrentSession(msgs)}
            builderData={currentSession.builderData}
            setBuilderData={(data) => updateCurrentSession(currentSession.messages, data)}
          />
        )}

        {currentMode === AppMode.VISUALIZER && (
          <VisualizerPanel
            initialPrompt={visualizerState.prompt}
            state={visualizerState}
            setState={setVisualizerState}
            currentSessionId={currentSessionId}
            onAssetCreated={handleAddMediaAsset}
          />
        )}

        {currentMode === AppMode.RESTYLER && (
          <RestylerPanel
            state={restylerState}
            setState={setRestylerState}
            currentSessionId={currentSessionId}
            onAssetCreated={handleAddMediaAsset}
          />
        )}

        {currentMode === AppMode.MEDIA && (
          <MediaLibraryPanel
            assets={mediaAssets}
            onDelete={handleDeleteMediaAsset}
          />
        )}
      </main>
    </div>
  );
}
