// Web version — uses @zxing/browser (works in all browsers including Safari)
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/browser';

interface Props {
  onScanned: (code: string) => void;
  active: boolean;
}

export default function BarcodeCamera({ onScanned, active }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const activeRef = useRef(active);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();
    readerRef.current = codeReader;

    codeReader
      .decodeFromVideoDevice(undefined, videoRef.current!, (result, err) => {
        if (result && activeRef.current) {
          onScanned(result.getText());
        }
        // NotFoundException is normal when no barcode in frame — ignore it
      })
      .catch((e) => {
        console.warn('ZXing init error:', e);
      });

    return () => {
      try {
        codeReader.reset();
      } catch (_) {}
    };
  }, []);

  return (
    <View style={styles.container}>
      {/* @ts-ignore — video is a DOM element, not RN */}
      <video
        ref={videoRef}
        style={styles.video as any}
        playsInline
        muted
        autoPlay
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFillObject },
  video: {
    position: 'absolute' as any,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
});
