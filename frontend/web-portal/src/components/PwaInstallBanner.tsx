import React from 'react';
import { Download } from 'lucide-react';
import { usePwaInstallPrompt } from '../hooks/usePwaInstallPrompt';

type Props = {
  className?: string;
};

const PwaInstallBanner = ({ className }: Props) => {
  const { canPrompt, isInstalled, promptInstall, dismiss } = usePwaInstallPrompt();

  if (isInstalled || !canPrompt) return null;

  const handleInstall = async () => {
    await promptInstall();
    dismiss();
  };

  return (
    <div
      className={`flex items-center gap-3 bg-teal-50 text-teal-800 px-4 py-3 rounded-lg border border-teal-100 shadow-sm ${className || ''}`}
    >
      <Download size={18} />
      <div className="text-sm">
        <div className="font-semibold">Install CareSync</div>
        <div className="text-xs text-teal-700">Add the PWA for a full-screen experience.</div>
      </div>
      <button
        onClick={handleInstall}
        className="ml-auto bg-teal-600 text-white text-sm px-3 py-1.5 rounded-md hover:bg-teal-700"
      >
        Install
      </button>
      <button onClick={dismiss} className="text-xs text-teal-700 hover:underline">
        Later
      </button>
    </div>
  );
};

export default PwaInstallBanner;
