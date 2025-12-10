import { useCallback, useEffect, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;

export function usePwaInstallPrompt() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(isStandalone());

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    const onChange = () => setIsInstalled(isStandalone());
    window.matchMedia('(display-mode: standalone)').addEventListener('change', onChange);
    return () => window.matchMedia('(display-mode: standalone)').removeEventListener('change', onChange);
  }, []);

  const promptInstall = useCallback(async () => {
    if (!promptEvent) return null;
    await promptEvent.prompt();
    const choiceResult = await promptEvent.userChoice;
    setPromptEvent(null);
    return choiceResult.outcome;
  }, [promptEvent]);

  return {
    canPrompt: !!promptEvent,
    isInstalled,
    promptInstall,
    dismiss: () => setPromptEvent(null),
  };
}
