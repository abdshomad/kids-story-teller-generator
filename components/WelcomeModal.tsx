import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../App';
import { CheckCircle2, Heart, Eye, Sparkles, Globe, Search } from 'lucide-react';
import { LANGUAGES } from '../constants';

interface WelcomeModalProps {
  onAcknowledge: () => void;
}

const InfoCard: React.FC<{ icon: React.ReactNode; title: string; text: string; }> = ({ icon, title, text }) => (
    <div className="bg-white/50 rounded-2xl p-4 text-center backdrop-blur-sm">
        <div className="mb-2 flex justify-center">{icon}</div>
        <h3 className="font-bold text-slate-800 mb-1">{title}</h3>
        <p className="text-sm text-slate-600">{text}</p>
    </div>
);

const WelcomeModal: React.FC<WelcomeModalProps> = ({ onAcknowledge }) => {
  const { t, language, setLanguage } = useAppContext();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const primaryLanguages = LANGUAGES.filter(l => l.primary);
  const secondaryLanguages = LANGUAGES.filter(l => !l.primary)
    .filter(lang => lang.label.toLowerCase().includes(searchQuery.toLowerCase()));
  const currentLanguageDetails = LANGUAGES.find(l => l.code === language);
  const isSecondaryLanguageSelected = currentLanguageDetails && !currentLanguageDetails.primary;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity duration-300">
      <div className="bg-white/80 backdrop-blur-xl border border-white/30 rounded-3xl shadow-2xl max-w-4xl w-full p-6 sm:p-8 text-center transform transition-all duration-300 scale-100 opacity-100">
        
        <header className="flex flex-col sm:flex-row justify-between items-center sm:items-start gap-4 mb-6">
            <div className="text-center sm:text-start">
                <div className="flex justify-center sm:justify-start items-center gap-4 mb-4">
                    <span className="text-5xl">🤗</span>
                    <span className="text-5xl">📚</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-1">{t('welcome.title')}</h2>
                <p className="text-fuchsia-600 font-bold">{t('welcome.subtitle')}</p>
            </div>
            
            <div className="w-full sm:w-auto flex justify-center sm:justify-end">
                <div className="flex items-center gap-1 bg-gray-200/50 rounded-full p-1 shadow-inner">
                    {primaryLanguages.map(lang => (
                        <button
                            key={lang.code}
                            onClick={() => { setLanguage(lang.code); setIsDropdownOpen(false); setSearchQuery(''); }}
                            className={`px-3 py-1 text-sm font-bold rounded-full transition-colors ${language === lang.code ? 'bg-white shadow-md text-slate-800' : 'text-slate-500 hover:bg-white/60'}`}
                        >
                            {lang.label}
                        </button>
                    ))}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setIsDropdownOpen(prev => {
                                if (prev) setSearchQuery('');
                                return !prev;
                            })}
                            className={`w-10 h-8 flex items-center justify-center rounded-full transition-colors ${isSecondaryLanguageSelected ? 'bg-white shadow-md' : 'text-slate-500 hover:bg-white/60'}`}
                            aria-haspopup="true"
                            aria-expanded={isDropdownOpen}
                        >
                            {isSecondaryLanguageSelected && currentLanguageDetails ? (
                              <span className="text-lg">{currentLanguageDetails.flag}</span>
                            ) : (
                              <Globe className="w-5 h-5" />
                            )}
                        </button>
                        {isDropdownOpen && (
                            <div className="absolute top-full mt-2 end-0 bg-white rounded-xl shadow-lg border border-slate-200/80 z-10 w-52">
                                <div className="p-2 relative">
                                    <Search className="w-4 h-4 text-slate-400 absolute top-1/2 left-5 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        placeholder={t('common.search')}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full ps-9 p-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-fuchsia-300 focus:border-fuchsia-300"
                                        autoFocus
                                    />
                                </div>
                                <div className="max-h-48 overflow-y-auto p-2 pt-0">
                                    {secondaryLanguages.map(lang => (
                                        <button
                                            key={lang.code}
                                            onClick={() => { setLanguage(lang.code); setIsDropdownOpen(false); setSearchQuery(''); }}
                                            className={`w-full flex items-center gap-3 text-start p-2 rounded-lg text-sm transition-colors ${language === lang.code ? 'bg-slate-100 font-bold text-slate-800' : 'text-slate-600 hover:bg-slate-50'}`}
                                        >
                                            <span className="text-lg">{lang.flag}</span>
                                            <span>{lang.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <InfoCard 
                icon={<div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center"><CheckCircle2 className="w-6 h-6 text-green-600" /></div>}
                title={t('welcome.card1.title')}
                text={t('welcome.card1.text')}
            />
            <InfoCard 
                icon={<div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center"><Heart className="w-6 h-6 text-red-500" /></div>}
                title={t('welcome.card2.title')}
                text={t('welcome.card2.text')}
            />
            <InfoCard 
                icon={<div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center"><Eye className="w-6 h-6 text-purple-600" /></div>}
                title={t('welcome.card3.title')}
                text={t('welcome.card3.text')}
            />
            <InfoCard 
                icon={<div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center"><Sparkles className="w-6 h-6 text-blue-500" /></div>}
                title={t('welcome.card4.title')}
                text={t('welcome.card4.text')}
            />
        </div>

        <button
          onClick={onAcknowledge}
          className="w-full sm:w-auto bg-fuchsia-600 text-white font-bold tracking-wider py-4 px-10 rounded-full hover:bg-fuchsia-700 focus:outline-none focus:ring-4 focus:ring-fuchsia-300 transition-all duration-300 shadow-lg text-lg"
        >
          {t('welcome.button')}
        </button>
      </div>
    </div>
  );
};

export default WelcomeModal;