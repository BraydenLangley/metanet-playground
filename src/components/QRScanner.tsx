import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { QrCode, X } from "lucide-react";
import QrScanner from "qr-scanner";

interface QRScannerProps {
  onScanSuccess: (data: string) => void;
  isScanning: boolean;
  onStartScanning: () => void;
  onStopScanning: () => void;
  className?: string;
}

const QRScannerComponent = ({ 
  onScanSuccess, 
  isScanning, 
  onStartScanning, 
  onStopScanning,
  className = ""
}: QRScannerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);
  const { toast } = useToast();

  const startCameraScanning = async () => {
    if (!videoRef.current) return;

    try {
      const hasCamera = await QrScanner.hasCamera();
      
      if (!hasCamera) {
        toast({
          title: "No camera found",
          description: "Your device doesn't have a camera or camera access is denied",
          variant: "destructive"
        });
        onStopScanning();
        return;
      }

      qrScannerRef.current = new QrScanner(
        videoRef.current,
        (result) => {
          onScanSuccess(result.data);
          // Clean up camera resources
          if (qrScannerRef.current) {
            qrScannerRef.current.stop();
            qrScannerRef.current.destroy();
            qrScannerRef.current = null;
          }
          // Stop media stream
          if (videoRef.current?.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
          }
          onStopScanning();
        },
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
          returnDetailedScanResult: true,
          preferredCamera: 'environment',
        }
      );

      await qrScannerRef.current.start();
      
    } catch (error) {
      toast({
        title: "Camera access failed", 
        description: "Could not access camera. Please check permissions.",
        variant: "destructive"
      });
      onStopScanning();
    }
  };

  // Cleanup and state management effects
  useEffect(() => {
    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (isScanning && !qrScannerRef.current) {
      startCameraScanning();
    }
  }, [isScanning]);

  return (
    <Card className={`p-4 ${className}`}>
      {isScanning ? (
        <div className="space-y-3">
          <video
            ref={videoRef}
            className="w-full h-48 rounded-md bg-black"
          />
          <Button variant="outline" onClick={onStopScanning} className="w-full">
            <X className="h-4 w-4 mr-2" />
            Stop Scanning
          </Button>
        </div>
      ) : (
        <Button onClick={onStartScanning} className="w-full">
          <QrCode className="h-4 w-4 mr-2" />
          Start Camera Scan
        </Button>
      )}
    </Card>
  );
};

export default QRScannerComponent;