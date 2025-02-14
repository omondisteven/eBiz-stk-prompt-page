//QrScannerNormal.tsx
import Layout from "@/components/Layout";
import { useState, useRef, useEffect } from "react";
import { BrowserMultiFormatReader, Result, NotFoundException } from "@zxing/library";

const QrScannerNormal = () => {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [currentCamera, setCurrentCamera] = useState<MediaDeviceInfo | null>(null);
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const openLinkButtonRef = useRef<HTMLButtonElement>(null); // Ref for the "Open Link" button
  const codeReader = new BrowserMultiFormatReader();
  const [isFrontCamera, setIsFrontCamera] = useState(false);
  const [autoOpenLinks, setAutoOpenLinks] = useState(true); // State for auto-opening links

  // Fetch available cameras
  useEffect(() => {
    codeReader
      .listVideoInputDevices()
      .then((devices) => {
        setCameraDevices(devices);
        updateCameraSelection(devices);
      })
      .catch(console.error);

    return () => {
      stopScan();
    };
  }, []);

  useEffect(() => {
    startScan();
    return () => {
      stopScan();
    };
  }, [currentCamera]);

  useEffect(() => {
    updateCameraSelection(cameraDevices);
    return () => {
      stopScan();
    };
  }, [isFrontCamera, cameraDevices]);

  const updateCameraSelection = (devices: MediaDeviceInfo[]) => {
    const selectedCamera = isFrontCamera
      ? devices.find(device => device.label.toLowerCase().includes("front"))
      : devices.find(device => device.label.toLowerCase().includes("back")) ||
        devices.find(device => device.kind === 'videoinput') ||
        devices[0];

    setCurrentCamera(selectedCamera || null);
  };

  const startScan = () => {
    if (currentCamera && videoRef.current) {
      setIsScanning(true);
      codeReader.decodeFromVideoDevice(currentCamera.deviceId, videoRef.current, (result: Result | null, err: any) => {
        if (result) {
          setScanResult(result.getText());
          stopScan();

          // Automatically trigger the "Open Link" button if the result is a URL and autoOpenLinks is true
          if (result.getText().startsWith("http") && autoOpenLinks) {
            setTimeout(() => {
              openLinkButtonRef.current?.click(); // Trigger the button click
            }, 100); // Small delay to ensure the button is rendered
          }
        }
        if (err && !(err instanceof NotFoundException)) {
          console.error(err);
        }
      });
    } else if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const stopScan = () => {
    setIsScanning(false);
    codeReader.reset();
    if (videoRef.current) {
      const stream = videoRef.current.srcObject as MediaStream;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      videoRef.current.srcObject = null;
    }
  };

  const toggleCamera = () => {
    setIsFrontCamera(!isFrontCamera);
  };

  const handleCameraChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedDeviceId = event.target.value;
    const selectedCamera = cameraDevices.find(device => device.deviceId === selectedDeviceId);
    setCurrentCamera(selectedCamera || null);
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      codeReader.decodeFromImageUrl(imageUrl).then((result) => {
        setScanResult(result.getText());

        // Automatically trigger the "Open Link" button if the result is a URL and autoOpenLinks is true
        if (result.getText().startsWith("http") && autoOpenLinks) {
          setTimeout(() => {
            openLinkButtonRef.current?.click(); // Trigger the button click
          }, 100); // Small delay to ensure the button is rendered
        }
      }).catch(console.error);
    }
  };

  // Copy result to clipboard
  const copyResult = () => {
    if (scanResult) {
      navigator.clipboard.writeText(scanResult);
      alert("Copied to clipboard!");
    }
  };

  // Open URL in a new tab
  const openLink = () => {
    if (scanResult && scanResult.startsWith("http")) {
      window.open(scanResult, "_blank");
    }
  };

  // Toggle auto-open links setting
  const toggleAutoOpenLinks = () => {
    setAutoOpenLinks((prev) => !prev);
  };

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4">QR Code Scanner</h1>

        {/* Settings Toggle */}
        {/* <div className="mb-4">
          <label className="flex items-center space-x-2">
            <span>Auto-Open Links:</span>
            <button
              onClick={toggleAutoOpenLinks}
              className={`px-4 py-2 rounded ${autoOpenLinks ? "bg-green-500" : "bg-red-500"} text-white`}
            >
              {autoOpenLinks ? "ON" : "OFF"}
            </button>
          </label>
        </div> */}

        {/* Camera Selection */}
        <div className="mb-4">
          <button onClick={toggleCamera} className="p-2 border rounded bg-yellow-500 text-blue font-bold">
            {isFrontCamera ? "Switch to Back Camera" : "Switch to Front Camera"}
          </button>
        </div>

        {/* Video Preview */}
        <div className="relative w-full max-w-md mb-4">
          <video ref={videoRef} className="w-full h-auto rounded-lg shadow-md" />
          {!isScanning && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
              <p className="text-white">Camera is off</p>
            </div>
          )}
        </div>

        {/* Scan Buttons */}
        <div className="flex space-x-4 mb-4">
          <button
            onClick={isScanning ? stopScan : startScan}
            className={`px-4 py-2 rounded ${isScanning ? "bg-red-500" : "bg-blue-500"} text-white`}
          >
            {isScanning ? "Stop Scan" : "Start Scan"}
          </button>
        </div>

        {/* Divider */}
        <div className="w-full h-1 bg-blue-500 mb-4"></div>

        {/* File Upload */}
        <div className="mb-4">
          <p>Decode from File</p>
          <input type="file" accept="image/*" onChange={handleFileUpload} className="p-2 border rounded" />
        </div>

        {/* Scan Result */}
        {scanResult && (
          <div className="w-full max-w-md p-4 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-2">Scan Result:</h2>
            <p className="mb-4 break-all">{scanResult}</p>
            <div className="flex space-x-4">
              <button onClick={copyResult} className="px-4 py-2 bg-blue-500 text-white rounded">
                Copy
              </button>
              {scanResult.startsWith("http") && (
                <button
                  ref={openLinkButtonRef}
                  onClick={openLink}
                  className="px-4 py-2 bg-green-500 text-white rounded"
                >
                  Open Link
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default QrScannerNormal;