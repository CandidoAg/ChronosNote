import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { translations } from '../utils/translations';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { username, email, avatarColor, avatarUrl, language, darkMode, updatePreferences } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'language'>('profile');
  
  const t = translations[language] || translations['en'];

  const [selectedColor, setSelectedColor] = useState(avatarColor);
  const [selectedUrl, setSelectedUrl] = useState(avatarUrl || '');
  const [selectedLang, setSelectedLang] = useState(language);
  const [selectedDark, setSelectedDark] = useState(darkMode);

  useEffect(() => {
    if (isOpen) {
      setSelectedColor(avatarColor);
      setSelectedUrl(avatarUrl || '');
      setSelectedLang(language);
      setSelectedDark(darkMode);
    }
  }, [isOpen, avatarColor, avatarUrl, language, darkMode]);

  if (!isOpen) return null;

  const colors = [
    'bg-purple-600', 'bg-blue-600', 'bg-green-600', 
    'bg-red-500', 'bg-amber-500', 'bg-pink-500', 'bg-gray-700'
  ];

  const handleSaveChange = (color: string, url: string, lang: string, dark: boolean) => {
    setSelectedColor(color);
    setSelectedUrl(url);
    setSelectedLang(lang);
    setSelectedDark(dark);
    
    updatePreferences(color, url, lang, dark);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-100 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1e1e1e] w-full max-w-2xl h-[480px] rounded-xl shadow-2xl border border-gray-200 dark:border-[#2f2f2f] flex overflow-hidden animate-in zoom-in-95 duration-200 transition-colors">
        
        {/* Navigation Tab List */}
        <div className="w-48 bg-gray-50 dark:bg-[#191919] border-r border-gray-200 dark:border-[#2f2f2f] p-3 flex flex-col gap-1 select-none">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-2 mb-2">{t.settingsTitle}</p>
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full text-left px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'profile' ? 'bg-gray-200 dark:bg-[#2c2c2c] text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#202020]'}`}
          >
            {t.profileTab}
          </button>
          <button
            onClick={() => setActiveTab('appearance')}
            className={`w-full text-left px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'appearance' ? 'bg-gray-200 dark:bg-[#2c2c2c] text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#202020]'}`}
          >
            {t.appearanceTab}
          </button>
          <button
            onClick={() => setActiveTab('language')}
            className={`w-full text-left px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'language' ? 'bg-gray-200 dark:bg-[#2c2c2c] text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#202020]'}`}
          >
            {t.languageTab}
          </button>
          
          <button 
            onClick={onClose}
            className="mt-auto w-full text-center px-3 py-1.5 bg-gray-900 hover:bg-gray-800 dark:bg-purple-600 dark:hover:bg-purple-700 text-white rounded-lg text-xs font-medium transition-colors"
          >
            {t.closeBtn}
          </button>
        </div>

        {/* Dynamic Display Board View */}
        <div className="flex-1 p-6 overflow-y-auto">
          
          {/* PROFILE CONTROL VIEW */}
          {activeTab === 'profile' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Account Identity</h3>
              </div>
              
              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-[#252525] rounded-xl border border-gray-100 dark:border-[#2f2f2f]">
                {selectedUrl ? (
                  <img src={selectedUrl} alt="Preview" className="w-14 h-14 rounded-full object-cover shadow-sm border border-gray-300 dark:border-gray-700" />
                ) : (
                  <div className={`w-14 h-14 rounded-full ${selectedColor} flex items-center justify-center text-xl font-bold text-white uppercase shadow-sm`}>
                    {(username || 'U').charAt(0)}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-700 dark:text-gray-300 text-sm">{username || 'User identity'}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{email}</p>
                </div>
              </div>

              {/* 🔑 Input Field for Custom Remote Hosting Avatar Link URL */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Custom Profile Picture URL</label>
                <input 
                  type="url"
                  placeholder="https://images.unsplash.com/photo-example..."
                  value={selectedUrl}
                  onChange={(e) => handleSaveChange(selectedColor, e.target.value, selectedLang, selectedDark)}
                  className="w-full p-2.5 bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#2f2f2f] rounded-lg text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t.avatarLabel}</label>
                <div className="flex gap-2">
                  {colors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => handleSaveChange(color, selectedUrl, selectedLang, selectedDark)}
                      className={`w-7 h-7 rounded-full ${color} transition-transform ${selectedColor === color ? 'scale-125 ring-2 ring-offset-2 ring-purple-500 dark:ring-offset-[#1e1e1e]' : 'hover:scale-110'}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* VISUAL APPEARANCE VIEW */}
          {activeTab === 'appearance' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{t.appearanceTab}</h3>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#252525] rounded-lg border border-gray-100 dark:border-[#2f2f2f]">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.darkModeLabel}</span>
                <input 
                  type="checkbox" 
                  checked={selectedDark}
                  onChange={(e) => handleSaveChange(selectedColor, selectedUrl, selectedLang, e.target.checked)}
                  className="w-4 h-4 accent-purple-600 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* LOCALIZATION & LANGUAGE VIEW */}
          {activeTab === 'language' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{t.languageTab}</h3>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t.langLabel}</label>
                <select 
                  value={selectedLang}
                  onChange={(e) => handleSaveChange(selectedColor, selectedUrl, e.target.value, selectedDark)}
                  className="w-full p-2.5 bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#2f2f2f] rounded-lg text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  <option value="en">English (US)</option>
                  <option value="es">Español (ES)</option>
                  <option value="fr">Français (FR)</option>
                </select>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};