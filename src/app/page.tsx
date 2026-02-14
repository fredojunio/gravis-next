'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function LandingPage() {
  return (
    <div className="min-h-screen w-full bg-[#161a1d] text-white flex flex-col items-center justify-center relative overflow-hidden font-sans">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full"></div>

      {/* Navigation */}
      <nav className="absolute top-0 w-full px-4 py-6 md:p-8 flex justify-between items-center max-w-7xl mx-auto z-50">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo/logo.png"
            alt="Gravis AI Logo"
            width={40}
            height={40}
            className="rounded-lg shadow-lg w-8 h-8 md:w-10 md:h-10"
          />
          <span className="text-xl md:text-2xl font-bold tracking-tight">GRAVIS <span className="text-blue-500">AI</span></span>
        </Link>
        <div className="flex gap-8 items-center">
          <Link href="/auth/signin" className="px-5 py-2 md:px-6 md:py-2 rounded-full border border-white/10 hover:bg-white/5 transition-all text-sm font-medium backdrop-blur-sm">
            Sign In
          </Link>
          {/* <Link href="/auth/signup" className="px-6 py-2 rounded-full bg-blue-600 hover:bg-blue-500 transition-all text-sm font-medium shadow-lg shadow-blue-600/20">
            Get Started
          </Link> */}
        </div>
      </nav>

      {/* Hero Content */}
      <div className="z-10 text-center px-4 max-w-4xl mt-10 md:mt-0">
        <div className="hidden md:inline-block mb-6 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/5 text-blue-400 text-xs font-semibold tracking-widest uppercase">
          The Future of Architectural Visualization
        </div>
        <h1 className="text-5xl md:text-8xl font-bold mb-6 md:mb-8 tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40 leading-tight">
          Design with the <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">Speed of Thought.</span>
        </h1>
        <p className="text-lg md:text-2xl text-white/50 mb-10 md:mb-12 max-w-2xl mx-auto leading-relaxed px-2">
          Gravis AI is your intelligent partner for professional architectural rendering, restyling, and concept generation. Powered by advanced AI.
        </p>

        <div className="flex flex-col md:flex-row gap-4 md:gap-6 justify-center items-center px-4 w-full">
          <Link href="/auth/signin" className="group relative w-full md:w-auto px-10 py-4 md:py-5 bg-white text-black font-bold rounded-2xl hover:scale-105 transition-all flex items-center justify-center gap-3 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-white opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <span className="relative z-10">Start Creating Now</span>
            <svg className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          {/* <button className="px-10 py-5 bg-white/5 backdrop-blur-md border border-white/10 text-white font-semibold rounded-2xl hover:bg-white/10 transition-all">
            View Showcases
          </button> */}
        </div>
      </div>

      {/* Floating Elements (Visual Interest) */}
      <div className="absolute top-1/4 left-10 w-24 h-24 bg-white/5 rounded-2xl rotate-12 blur-sm"></div>
      <div className="absolute bottom-1/4 right-10 w-32 h-32 bg-white/5 rounded-full blur-sm"></div>

      {/* Subtle Grid Background */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>

      {/* Footer Decoration */}
      <div className="absolute bottom-0 w-full h-[300px] bg-gradient-to-t from-blue-500/10 to-transparent pointer-events-none"></div>
    </div>
  );
}
