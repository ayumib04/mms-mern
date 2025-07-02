// frontend/src/hooks/useWebSocket.js
import { useEffect, useCallback } from 'react';
import { subscribeToEvent } from '../services/websocket';

export const useWebSocket = (event, callback, deps = []) => {
  const memoizedCallback = useCallback(callback, deps);

  useEffect(() => {
    const unsubscribe = subscribeToEvent(event, memoizedCallback);
    return unsubscribe;
  }, [event, memoizedCallback]);
};