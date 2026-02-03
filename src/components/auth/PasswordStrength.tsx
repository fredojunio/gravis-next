'use client';

import React from 'react';

interface PasswordStrengthProps {
    password: string;
}

export default function PasswordStrength({ password }: PasswordStrengthProps) {
    const getStrength = (pass: string) => {
        let strength = 0;
        if (pass.length === 0) return 0;
        if (pass.length >= 8) strength += 1;
        if (/[A-Z]/.test(pass)) strength += 1;
        if (/[0-9]/.test(pass)) strength += 1;
        if (/[^a-zA-Z0-9]/.test(pass)) strength += 1;
        return strength;
    };

    const strength = getStrength(password);

    const getLabel = (s: number) => {
        if (s === 0) return '';
        if (s <= 1) return 'Weak';
        if (s <= 2) return 'Fair';
        if (s <= 3) return 'Good';
        return 'Strong';
    };

    const getColor = (s: number) => {
        if (s <= 1) return 'bg-red-500';
        if (s <= 2) return 'bg-orange-500';
        if (s <= 3) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    return (
        <div className="mt-2 space-y-2">
            <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase tracking-wider text-white/30 font-bold">Strength</span>
                <span className={`text-[10px] font-bold uppercase ${strength <= 1 ? 'text-red-400' : strength <= 2 ? 'text-orange-400' : strength <= 3 ? 'text-yellow-400' : 'text-green-400'
                    }`}>
                    {getLabel(strength)}
                </span>
            </div>
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden flex gap-1">
                {[1, 2, 3, 4].map((step) => (
                    <div
                        key={step}
                        className={`h-full flex-1 transition-all duration-500 ${strength >= step ? getColor(strength) : 'bg-white/0'
                            }`}
                    />
                ))}
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <Requirement met={password.length >= 8} label="8+ chars" />
                <Requirement met={/[A-Z]/.test(password)} label="Capital Letter" />
                <Requirement met={/[0-9]/.test(password)} label="Number" />
                <Requirement met={/[^a-zA-Z0-9]/.test(password)} label="Special Char" />
            </div>
        </div>
    );
}

function Requirement({ met, label }: { met: boolean; label: string }) {
    return (
        <div className="flex items-center gap-1.5">
            <div className={`w-1 h-1 rounded-full ${met ? 'bg-green-500' : 'bg-white/10'}`} />
            <span className={`text-[10px] ${met ? 'text-white/60' : 'text-white/20'}`}>{label}</span>
        </div>
    );
}
