import Layout from "@/components/Layout";
import { useState, useRef, useEffect } from "react";
import { BrowserMultiFormatReader, Result, NotFoundException } from "@zxing/library";

const QrScannerNormal = () => {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [currentCamera, setCurrentCamera] = useState<MediaDeviceInfo | null>(null); // Store the current camera object
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReader = new BrowserMultiFormatReader();
  const [isFrontCamera, setIsFrontCamera] = useState(false); // New state for front/back toggle

  // Fetch available cameras
  useEffect(() => {
    codeReader
      .listVideoInputDevices()
      .then((devices) => {
        setCameraDevices(devices);
        updateCameraSelection(devices); // Select initial camera
      })
      .catch(console.error);

    return () => {
      stopScan(); // Cleanup on unmount
    };
  }, []); // Empty dependency array for initial camera fetch

  useEffect(() => {
    startScan(); // Start/restart scan whenever currentCamera changes
    return () => {
      // Clean up the previous scan when the effect runs again (camera changed)
      stopScan();
    };
  }, [currentCamera]); // currentCamera is the dependency

  useEffect(() => {
    // This effect handles the front/back camera toggle
    updateCameraSelection(cameraDevices); // Update camera based on isFrontCamera
    return () => {
      stopScan();
    };
  }, [isFrontCamera, cameraDevices]); // isFrontCamera and cameraDevices are the dependencies

  const updateCameraSelection = (devices: MediaDeviceInfo[]) => {
    const selectedCamera = isFrontCamera
      ? devices.find(device => device.label.toLowerCase().includes("front"))
      : devices.find(device => device.label.toLowerCase().includes("back")) ||
        devices.find(device => device.kind === 'videoinput') || // Find any video input device if back is not available.
        devices[0]; //Fallback to the first device

    setCurrentCamera(selectedCamera || null);
  };

  const startScan = () => {
    if (currentCamera && videoRef.current) {
      setIsScanning(true);
      codeReader.decodeFromVideoDevice(currentCamera.deviceId, videoRef.current, (result: Result | null, err: any) => {
        if (result) {
          setScanResult(result.getText());
          stopScan(); // Stop after successful scan
        }
        if (err && !(err instanceof NotFoundException)) {
          console.error(err);
        }
      });
    } else if (videoRef.current) {
      videoRef.current.srcObject = null; // Clear if no camera available
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
    setCurrentCamera(selectedCamera || null); // Update the current camera
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      codeReader.decodeFromImageUrl(imageUrl).then((result) => {
        setScanResult(result.getText());
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

  // Open URL if result is a link
  const openLink = () => {
    if (scanResult && scanResult.startsWith("http")) {
      window.open(scanResult, "_blank");
    }
  };

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4">QR Code Scanner</h1>

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
        <div className="w-full h-1 bg-blue-500 mb-4"></div> {/* Blue divider */}

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
                <button onClick={openLink} className="px-4 py-2 bg-green-500 text-white rounded">
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