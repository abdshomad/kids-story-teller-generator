import React, { FC } from 'react';

const OptionSelector: FC<{ 
    label: string; 
    value: string; 
    onChange: (value: string) => void; 
    options: { value: string; label: string; }[] 
}> = ({ label, value, onChange, options }) => (
    <div>
        <label className="block text-sm font-bold text-slate-600 mb-2">{label}</label>
        <div className="flex flex-wrap gap-2">
            {options.map(opt => (
                <button
                    key={opt.value}
                    type="button"
                    onClick={() => onChange(opt.value)}
                    className={`px-3 py-1.5 text-sm font-bold rounded-full transition-colors ${value === opt.value ? 'bg-fuchsia-500 text-white shadow' : 'bg-slate-200/80 text-slate-700 hover:bg-slate-300/80'}`}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    </div>
);

export default OptionSelector;