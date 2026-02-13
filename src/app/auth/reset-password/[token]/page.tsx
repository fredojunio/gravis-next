'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { resetPassword } from '@/lib/actions/passwordResetActions';
import PasswordStrength from '@/components/auth/PasswordStrength';
import Image from 'next/image';

export default function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = use(params);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);
        setError('');

        const result = await resetPassword(token, password);

        if (result.error) {
            setError(result.error);
            setLoading(false);
        } else {
            setSuccess(true);
            setTimeout(() => {
                router.push('/auth/signin');
            }, 3000);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen w-full bg-[#161a1d] flex items-center justify-center p-4 font-sans relative overflow-hidden">
                <div className="w-full max-w-md bg-white/[0.03] backdrop-blur-xl border border-white/10 p-10 rounded-[32px] shadow-2xl relative z-10 text-center">
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Password Reset Successful</h1>
                    <p className="text-white/40 text-sm mb-8">You can now sign in with your new password. Redirecting to login...</p>
                    <Link href="/auth/signin" className="text-blue-400 font-semibold hover:text-blue-300">
                        Go to Sign In
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-[#161a1d] flex items-center justify-center p-4 font-sans relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/5 blur-[100px] rounded-full pointer-events-none"></div>

            <div className="w-full max-w-md bg-white/[0.03] backdrop-blur-xl border border-white/10 p-10 rounded-[32px] shadow-2xl relative z-10">
                <div className="text-center mb-10">
                    <Link href="/" className="inline-flex items-center gap-2 mb-8 group">
                        <Image
                            src="/logo/logo.png"
                            alt="Gravis AI Logo"
                            width={32}
                            height={32}
                            className="rounded-lg shadow-lg"
                        />
                        <span className="text-xl font-bold text-white tracking-tight">GRAVIS AI</span>
                    </Link>
                    <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Set New Password</h1>
                    <p className="text-white/40 text-sm">Please enter your new secure password</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-semibold text-white/40 uppercase tracking-widest mb-2 ml-1">New Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                            placeholder="••••••••"
                            required
                        />
                        <PasswordStrength password={password} />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-white/40 uppercase tracking-widest mb-2 ml-1">Confirm Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                            placeholder="••••••••"
                            required
                        />
                        {confirmPassword && password !== confirmPassword && (
                            <p className="text-[10px] text-red-400 mt-2 ml-1 font-semibold italic">Passwords do not match</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            'Reset Password'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
