
import React from 'react';
import { useAppContext } from '../App';
import BookOpenIcon from './icons/BookOpenIcon';

interface WelcomeModalProps {
  onAcknowledge: () => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ onAcknowledge }) => {
  const { t } = useAppContext();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center transform transition-all scale-100 opacity-100">
        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-yellow-100 mb-4 border-4 border-yellow-200">
          <BookOpenIcon className="h-12 w-12 text-yellow-500" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-800 mb-4">{t('welcome.title')}</h2>
        <p className="text-slate-600 mb-3">{t('welcome.p1')}</p>
        <p className="text-slate-600 mb-8">{t('welcome.p2')}</p>
        <button
          onClick={onAcknowledge}
          className="w-full bg-blue-500 text-white font-bold py-3 px-4 rounded-xl hover:bg-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all duration-300 shadow-lg"
        >
          {t('welcome.button')}
        </button>
      </div>
    </div>
  );
};

export default WelcomeModal;
