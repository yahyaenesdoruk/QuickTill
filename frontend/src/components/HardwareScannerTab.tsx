import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

// When running inside Chromium on the Raspberry Pi,
// this connects to the local barcode_service.py WebSocket.
const WS_URL = 'ws://localhost:8765';

type Status = 'connecting' | 'ready' | 'error';

interface Props {
  onCode: (code: string) => void;
}

export default function HardwareScannerTab({ onCode }: Props) {
  const [status, setStatus] = useState<Status>('connecting');
  const wsRef = useRef<WebSocket | null>(null);

  const connect = () => {
    setStatus('connecting');
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus('ready');
    };

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.barcode) {
          onCode(data.barcode);
        }
      } catch (_) {}
    };

    ws.onerror = () => setStatus('error');
    ws.onclose = () => setStatus('error');
  };

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
    };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Ionicons
          name={
            status === 'ready'
              ? 'checkmark-circle'
              : status === 'connecting'
              ? 'radio-outline'
              : 'warning-outline'
          }
          size={72}
          color={
            status === 'ready'
              ? Colors.success
              : status === 'connecting'
              ? Colors.primary
              : Colors.error
          }
        />

        <Text style={styles.title}>
          {status === 'connecting'
            ? 'Connecting to device scanner...'
            : status === 'ready'
            ? 'Device Scanner Ready'
            : 'Scanner Not Connected'}
        </Text>

        <Text style={styles.sub}>
          {status === 'ready'
            ? 'Point the ESP32-CAM at a barcode — it will be detected automatically.'
            : status === 'connecting'
            ? `Connecting to ws://localhost:8765`
            : 'Make sure barcode_service.py is running on the Raspberry Pi.'}
        </Text>

        {status === 'error' && (
          <TouchableOpacity style={styles.retryBtn} onPress={connect}>
            <Ionicons name="refresh" size={18} color={Colors.white} />
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        )}

        {status === 'ready' && (
          <View style={styles.statusRow}>
            <View style={styles.dot} />
            <Text style={styles.statusText}>Live — waiting for barcode</Text>
          </View>
        )}
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>How it works</Text>
        <Text style={styles.infoText}>
          1. ESP32-CAM streams video over WiFi{'\n'}
          2. barcode_service.py decodes EAN-13 barcodes{'\n'}
          3. Decoded code is sent here via WebSocket{'\n'}
          4. Product is added to cart automatically
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    gap: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  sub: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
  },
  statusText: {
    fontSize: 13,
    color: Colors.success,
    fontWeight: '600',
  },
  retryBtn: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
  infoCard: {
    width: '100%',
    backgroundColor: `${Colors.primary}10`,
    borderRadius: 12,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: `${Colors.primary}25`,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  infoText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
