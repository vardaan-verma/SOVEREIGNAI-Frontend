import { useEffect, useState } from 'react';
import { subscribeNetworkLog, getNetworkLogSnapshot } from '../lib/networkMonitor';

// Subscribes the calling component to the live network activity log.
// Re-renders automatically as new fetch() calls happen anywhere in the app.
export function useNetworkLog() {
  const [log, setLog] = useState(() => getNetworkLogSnapshot());

  useEffect(() => subscribeNetworkLog(setLog), []);

  return log;
}