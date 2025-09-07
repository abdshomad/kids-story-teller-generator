import React from 'react';
import { useAppContext } from '../App';
import { CheckCircle2, Heart, Eye, Sparkles } from 'lucide-react';

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

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity duration-300">
      <div className="bg-white/80 backdrop-blur-xl border border-white/30 rounded-3xl shadow-2xl max-w-4xl w-full p-6 sm:p-8 text-center transform transition-all duration-300 scale-100 opacity-100">
        
        <div className="absolute top-4 right-4">
            <div className="flex gap-1 bg-gray-200/50 rounded-full p-1 shadow-inner">
                <button 
                    onClick={() => setLanguage('id')} 
                    className={`px-3 py-1 text-sm font-bold rounded-full transition-colors ${language === 'id' ? 'bg-white shadow-md text-slate-800' : 'text-slate-500'}`}
                >
                    ID
                </button>
                <button 
                    onClick={() => setLanguage('en')} 
                    className={`px-3 py-1 text-sm font-bold rounded-full transition-colors ${language === 'en' ? 'bg-white shadow-md text-slate-800' : 'text-slate-500'}`}
                >
                    EN
                </button>
            </div>
        </div>

        <div className="flex justify-center items-center gap-4 mb-4 mt-8 sm:mt-0">
            <span className="text-5xl">🤗</span>
            <span className="text-5xl">📚</span>
        </div>
        
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-1">{t('welcome.title')}</h2>
        <p className="text-fuchsia-600 font-bold mb-6 sm:mb-8">{t('welcome.subtitle')}</p>

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