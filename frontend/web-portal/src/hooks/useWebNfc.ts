import { useCallback, useMemo, useState } from 'react';

type NdefRecord = {
  recordType: string;
  data: string;
};

type UseWebNfcResult = {
  supported: boolean;
  reading: boolean;
  writing: boolean;
  error: string | null;
  lastMessage: string | null;
  startReading: () => Promise<void>;
  stopReading: () => void;
  write: (records: NdefRecord[]) => Promise<void>;
};

const supportsNfc = () => typeof window !== 'undefined' && 'NDEFReader' in window;

export function useWebNfc(): UseWebNfcResult {
  const supported = useMemo(() => supportsNfc(), []);
  const [reading, setReading] = useState(false);
  const [writing, setWriting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [controller, setController] = useState<AbortController | null>(null);

  const stopReading = useCallback(() => {
    controller?.abort();
    setReading(false);
  }, [controller]);

  const startReading = useCallback(async () => {
    if (!supported) {
      setError('Web NFC is not supported on this device/browser.');
      return;
    }
    const ndef = new (window as any).NDEFReader();
    const abortController = new AbortController();
    setController(abortController);
    setError(null);
    setReading(true);

    try {
      await ndef.scan({ signal: abortController.signal });
      ndef.onreadingerror = () => setError('Cannot read NFC tag. Try again.');
      ndef.onreading = (event: any) => {
        const decoder = new TextDecoder();
        const records = Array.from(event.message.records || []);
        const text = records
          .map((record: any) => decoder.decode(record.data))
          .join(' | ');
        setLastMessage(text);
      };
    } catch (err: any) {
      setError(err?.message || 'Failed to start NFC scanning.');
      setReading(false);
    }
  }, [supported, controller]);

  const write = useCallback(
    async (records: NdefRecord[]) => {
      if (!supported) {
        setError('Web NFC is not supported on this device/browser.');
        return;
      }
      setWriting(true);
      setError(null);
      try {
        const ndef = new (window as any).NDEFReader();
        await ndef.write({
          records: records.map((r) => ({
            recordType: r.recordType,
            data: r.data,
          })),
        });
      } catch (err: any) {
        setError(err?.message || 'Failed to write to NFC tag.');
      } finally {
        setWriting(false);
      }
    },
    [supported]
  );

  return {
    supported,
    reading,
    writing,
    error,
    lastMessage,
    startReading,
    stopReading,
    write,
  };
}
