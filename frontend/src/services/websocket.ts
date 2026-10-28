'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  WebSocketConnectionStatus,
  LiveTelemetryPayload,
  WebSocketEvent,
} from '@/types/websocket';

interface UseWebSocketOptions {
  enabled?: boolean;
  clientId?: string;
  onTelemetryUpdate?: (data: LiveTelemetryPayload) => void;
  onAlertTriggered?: (data: unknown) => void;
  onStatusChange?: (status: WebSocketConnectionStatus) => void;
}

export function useVolatiSafeWebSocket(options: UseWebSocketOptions = {}) {
  const {
    enabled = true,
    clientId = 'pwa-client',
    onTelemetryUpdate,
    onAlertTriggered,
    onStatusChange,
  } = options;

  const [status, setStatus] = useState<WebSocketConnectionStatus>('disconnected');
  const [lastTelemetry, setLastTelemetry] = useState<LiveTelemetryPayload | null>(null);
  const [lastAlert, setLastAlert] = useState<unknown | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);

  // Keep latest callbacks in refs to avoid reconnection loops on parent re-renders
  const onTelemetryUpdateRef = useRef(onTelemetryUpdate);
  onTelemetryUpdateRef.current = onTelemetryUpdate;

  const onAlertTriggeredRef = useRef(onAlertTriggered);
  onAlertTriggeredRef.current = onAlertTriggered;

  const onStatusChangeRef = useRef(onStatusChange);
  onStatusChangeRef.current = onStatusChange;

  const updateStatus = useCallback((newStatus: WebSocketConnectionStatus) => {
    setStatus(newStatus);
    onStatusChangeRef.current?.(newStatus);
  }, []);

  const connect = useCallback(() => {
    if (!enabled || typeof window === 'undefined') return;

    // Clean existing socket if any
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Determine WS URL
    let wsBaseUrl = process.env.NEXT_PUBLIC_WS_URL;
    if (!wsBaseUrl) {
      const host = window.location.hostname || 'localhost';
      wsBaseUrl = `ws://${host}:8000/ws/v1/live`;
    }

    const fullUrl = `${wsBaseUrl}?client_id=${encodeURIComponent(clientId)}`;
    updateStatus(reconnectAttemptsRef.current === 0 ? 'connecting' : 'reconnecting');

    try {
      const ws = new WebSocket(fullUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        if (!isMountedRef.current) return;
        reconnectAttemptsRef.current = 0;
        updateStatus('connected');

        // Setup ping heartbeat every 25 seconds
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send('ping');
          }
        }, 25000);
      };

      ws.onmessage = (event: MessageEvent) => {
        if (!isMountedRef.current) return;
        const raw = event.data;
        if (raw === 'pong') {
          return;
        }

        try {
          const parsed = JSON.parse(raw) as WebSocketEvent;
          if (parsed.event === 'TELEMETRY_UPDATE' && parsed.data) {
            setLastTelemetry(parsed.data);
            onTelemetryUpdateRef.current?.(parsed.data);
          } else if (parsed.event === 'ALERT_TRIGGERED' && parsed.data) {
            setLastAlert(parsed.data);
            onAlertTriggeredRef.current?.(parsed.data);
          }
        } catch {
          // ignore non-JSON messages
        }
      };

      ws.onerror = () => {
        // onerror will be followed by onclose
      };

      ws.onclose = () => {
        if (!isMountedRef.current) return;
        updateStatus('disconnected');

        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        // Schedule reconnection with exponential backoff (1s, 2s, 4s, max 10s)
        if (enabled) {
          const attempts = reconnectAttemptsRef.current;
          const delay = Math.min(1000 * Math.pow(2, attempts), 10000);
          reconnectAttemptsRef.current += 1;

          reconnectTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current && enabled) {
              connect();
            }
          }, delay);
        }
      };
    } catch {
      updateStatus('disconnected');
    }
  }, [enabled, clientId, updateStatus]);

  const sendJson = useCallback((data: unknown) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(data));
    }
  }, []);

  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    connect();
  }, [connect]);

  useEffect(() => {
    isMountedRef.current = true;
    connect();

    return () => {
      isMountedRef.current = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [connect]);

  return {
    status,
    isConnected: status === 'connected',
    lastTelemetry,
    lastAlert,
    sendJson,
    reconnect,
  };
}

