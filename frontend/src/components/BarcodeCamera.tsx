// Native version — uses expo-camera CameraView
import React from 'react';
import { StyleSheet } from 'react-native';
import { CameraView, BarcodeScanningResult } from 'expo-camera';

interface Props {
  onScanned: (code: string) => void;
  active: boolean;
}

export default function BarcodeCamera({ onScanned, active }: Props) {
  const handleScanned = (result: BarcodeScanningResult) => {
    onScanned(result.data);
  };

  return (
    <CameraView
      style={StyleSheet.absoluteFillObject}
      facing="back"
      barcodeScannerSettings={{
        barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'qr'],
      }}
      onBarcodeScanned={active ? handleScanned : undefined}
    />
  );
}
