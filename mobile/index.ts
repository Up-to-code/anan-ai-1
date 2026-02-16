import "react-native-gesture-handler";
import { registerRootComponent } from "expo";

import App from './App';

// #region agent log
const DEBUG_INGEST = 'http://127.0.0.1:7245/ingest/78cd20fc-b6ba-43f9-ac6b-c2cb1c79c3e3';
function debugLog(location: string, message: string, data?: Record<string, unknown>) {
  fetch(DEBUG_INGEST, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location, message, data: data ?? {}, timestamp: Date.now() }) }).catch(() => {});
}
const originalHandler = (global as any).ErrorUtils?.getGlobalHandler?.();
(global as any).ErrorUtils?.setGlobalHandler?.((error: Error, isFatal?: boolean) => {
  debugLog('index.ts:globalError', 'uncaught', { name: error?.name, message: error?.message, isFatal });
  originalHandler?.(error, isFatal);
});
debugLog('index.ts:bootstrap', 'app bootstrap started', {});
// #endregion

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
