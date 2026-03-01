import './src/tailwind-built.css';
import { useEffect, useState } from 'react';
import { initDatabase } from '@/db/init';
import RootNavigator from '@/navigation/RootNavigator';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { View, ActivityIndicator } from 'react-native';

async function prepare() {
  if (process.env.NODE_ENV === 'development') {
    const { worker } = await import('./src/mocks/browser');
    await worker.start({ onUnhandledRequest: 'bypass' });
  }
  await initDatabase();
}

export default function App() {
  const [ready, setReady] = useState(false);
  useEffect(() => { prepare().then(() => setReady(true)); }, []);
  if (!ready) return <View className="flex-1 items-center justify-center"><ActivityIndicator size="large" /></View>;
  return <ErrorBoundary><RootNavigator /></ErrorBoundary>;
}