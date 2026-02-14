'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function SignInPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            }) as any;

            if (result?.error) {
                setError('Invalid credentials. Please try again.');
            } else {
                router.push('/app');
            }
        } catch (err) {
            setError('An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-[#161a1d] flex items-center justify-center p-4 font-sans relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] md:w-[600px] md:h-[600px] bg-blue-500/5 blur-[60px] md:blur-[100px] rounded-full pointer-events-none"></div>

            <div className="w-full max-w-md bg-white/[0.03] backdrop-blur-xl border border-white/10 p-6 md:p-10 rounded-2xl md:rounded-[32px] shadow-2xl relative z-10 mx-4">
                <div className="text-center mb-8 md:mb-10">
                    <Link href="/" className="inline-flex items-center gap-2 mb-6 md:mb-8 group">
                        <Image
                            src="/logo/logo.png"
                            alt="Gravis AI Logo"
                            width={32}
                            height={32}
                            className="rounded-lg shadow-lg"
                        />
                        <span className="text-xl font-bold text-white tracking-tight">GRAVIS AI</span>
                    </Link>
                    <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 tracking-tight">Welcome Back</h1>
                    <p className="text-white/40 text-sm">Enter your credentials to access ArchiGen</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-2xl text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
                    <div>
                        <label className="block text-xs font-semibold text-white/40 uppercase tracking-widest mb-2 ml-1">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl md:rounded-2xl px-5 py-3 md:py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-sm md:text-base"
                            placeholder="user@example.com"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-white/40 uppercase tracking-widest mb-2 ml-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl md:rounded-2xl px-5 py-3 md:py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-sm md:text-base"
                            placeholder="••••••••"
                            required
                        />
                        <div className="flex justify-end mt-2 px-1">
                            <Link href="/auth/forgot-password" className="text-[10px] font-semibold text-white/20 uppercase tracking-widest hover:text-blue-400 transition-colors">
                                Forgot Password?
                            </Link>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 md:py-4 rounded-xl md:rounded-2xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-4 text-sm md:text-base"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </form>

                {/* <div className="mt-8 pt-8 border-t border-white/5 text-center">
                    <p className="text-white/40 text-sm">
                        Don't have an account?{' '}
                        <Link href="/auth/signup" className="text-blue-400 font-semibold hover:text-blue-300 transition-colors">
                            Create an account
                        </Link>
                    </p>
                </div> */}
            </div>
        </div>
    );
}
