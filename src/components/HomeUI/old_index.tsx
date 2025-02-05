import { useContext, useEffect, useState, useRef } from "react";
import QrSvg from "@wojtekmaj/react-qr-svg";
import Head from "next/head";
import HomeSEO from "@/components/HomeSEO";
import Link from "next/link";
import { useRouter } from "next/router";
import { generateQRCode } from "@/utils/helpers";
import { AppContext, AppContextType } from "@/context/AppContext";
import InstallButton from "../InstallButton";
import NumPad from "../NumPad";
import PaymentDetails from "../PaymentDetails";
import { FaGithub } from "react-icons/fa";
import { Input } from "../ui/input";
import { ColorPicker } from "../ColorPicker";
import { Button } from "../ui/button";
import { HiOutlineDownload, HiOutlineShare } from "react-icons/hi";
import { TRANSACTION_TYPE } from "@/@types/TransactionType";
import toast from "react-hot-toast";

const HomeUI = () => {
  const { data, setData } = useContext(AppContext) as AppContextType;

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState<boolean>(false);
  const [isShareSupported, setIsShareSupported] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Save the event so it can be triggered later.
      setDeferredPrompt(e as any);
      setShowInstallBtn(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };

    setIsShareSupported(checkWebShareSupport());
  }, []);
  const handleInstallClick = () => {
    // Hide the install button
    setShowInstallBtn(false);
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    deferredPrompt.userChoice.then((choiceResult: any) => {
      if (choiceResult.outcome === "accepted") {
        console.log("User accepted the install prompt");
      } else {
        console.log("User dismissed the install prompt");
      }
      setDeferredPrompt(null);
    });
  };

  const handleQRCodeDownload = () => {
    const svgElement = document.querySelector(".p-8.border-\\[12px\\]");
    if (!svgElement) return;

    // Get the SVG dimensions
    const svgRect = svgElement.getBoundingClientRect();

    // Create a canvas element
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (ctx == undefined || ctx == null) {
      toast.error("Something went wrong, please try again");
      return;
    }

    // Set explicit dimensions for the canvas
    canvas.width = svgRect.width;
    canvas.height = svgRect.height;

    // Convert SVG to string with explicit XML declaration and dimensions
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgString = `<?xml version="1.0" encoding="UTF-8"?>
      <svg xmlns="http://www.w3.org/2000/svg" width="${svgRect.width}" height="${svgRect.height}">
        ${svgData}
      </svg>`;

    // Create blob with proper XML encoding
    const svgBlob = new Blob([svgString], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(svgBlob);

    // Create image from SVG
    const img = new Image();

    // Important: Set these attributes for Firefox security policy
    img.crossOrigin = "anonymous";

    img.onload = () => {
      // Fill canvas with white background first
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw image to canvas
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Convert canvas to PNG with proper MIME type
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const pngUrl = URL.createObjectURL(blob);

            // Generate filename based on payment type
            let filename = "pesaqr_";
            if (data.type === TRANSACTION_TYPE.PAYBILL) {
              filename += `${data.paybillNumber}_${data.accountNumber}_${
                data.amount ?? 0
              }`;
            } else if (data.type === TRANSACTION_TYPE.TILL_NUMBER) {
              filename += `${data.tillNumber}_${data.amount ?? 0}`;
            } else if (data.type === TRANSACTION_TYPE.AGENT) {
              filename += `${data.agentNumber}_${data.storeNumber}_${
                data.amount ?? 0
              }`;
            } else if (data.type === TRANSACTION_TYPE.SEND_MONEY) {
              filename += `${data.phoneNumber}_${data.amount ?? 0}`;
            }
            filename += ".png";

            // Create and trigger download link
            const link = document.createElement("a");
            link.href = pngUrl;
            link.download = filename;

            // Firefox requires the link to be in the document
            document.body.appendChild(link);
            link.click();

            // Cleanup after a short delay to ensure download starts
            setTimeout(() => {
              document.body.removeChild(link);
              URL.revokeObjectURL(pngUrl);
              URL.revokeObjectURL(url);
            }, 100);
          }
        },
        "image/png",
        1.0
      ); // Added quality parameter
    };

    // Add error handling
    img.onerror = (error) => {
      console.error("Error loading SVG:", error);
      URL.revokeObjectURL(url);
    };

    img.src = url;
  };

  const checkWebShareSupport = () => {
    return navigator.share !== undefined && navigator.canShare !== undefined;
  };

  useEffect(() => {
    setIsShareSupported(checkWebShareSupport());
  }, []);

  const handleQRCodeShare = async () => {
    const svgElement = document.querySelector(".p-8.border-\\[12px\\]");
    if (!svgElement) return;

    try {
      // Get the SVG dimensions
      const svgRect = svgElement.getBoundingClientRect();

      // Create a canvas element
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (ctx == undefined || ctx == null) {
        toast.error("Something went wrong, please try again");
        return;
      }
      // Set canvas dimensions
      canvas.width = svgRect.width;
      canvas.height = svgRect.height;

      // Convert SVG to string with proper XML declaration
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgString = `<?xml version="1.0" encoding="UTF-8"?>
        <svg xmlns="http://www.w3.org/2000/svg" width="${svgRect.width}" height="${svgRect.height}">
          ${svgData}
        </svg>`;

      // Create blob with proper encoding
      const svgBlob = new Blob([svgString], {
        type: "image/svg+xml;charset=utf-8",
      });
      const url = URL.createObjectURL(svgBlob);

      // Create image from SVG
      const img = new Image();
      img.crossOrigin = "anonymous";

      // Convert to shareable file
      const sharePromise = new Promise((resolve, reject) => {
        img.onload = () => {
          // Fill canvas with white background
          ctx.fillStyle = "white";
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Draw image to canvas
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          // Convert canvas to blob
          canvas.toBlob(
            (blob) => {
              if (blob) {
                // Generate filename
                let filename = "pesaqr_";
                if (data.type === TRANSACTION_TYPE.PAYBILL) {
                  filename += `${data.paybillNumber}_${data.accountNumber}_${data.amount}`;
                } else if (data.type === TRANSACTION_TYPE.TILL_NUMBER) {
                  filename += `${data.tillNumber}_${data.amount}`;
                } else if (data.type === TRANSACTION_TYPE.AGENT) {
                  filename += `${data.agentNumber}_${data.storeNumber}_${data.amount}`;
                }else if (data.type === TRANSACTION_TYPE.SEND_MONEY) {
                  filename += `${data.phoneNumber}_${data.amount}`;
                }
                filename += ".png";

                // Create file object for sharing
                const file = new File([blob], filename, { type: "image/png" });
                resolve(file);
              } else {
                reject(new Error("Failed to create image blob"));
              }
            },
            "image/png",
            1.0
          );
        };

        img.onerror = () => reject(new Error("Failed to load image"));
      });

      img.src = url;

      // Wait for file creation
      const shareFile = await sharePromise;

      // Prepare share data
      let message = "";
      if (data.type === TRANSACTION_TYPE.SEND_MONEY) {
        message += `Scan this QR with the M-PESA app to send money to ${data.phoneNumber} - KES ${data.amount}`;
      } else if (data.type === TRANSACTION_TYPE.PAYBILL) {
        message += `Scan this QR with the M-PESA app to pay bill to ${data.paybillNumber} ${data.accountNumber} - KES ${data.amount}`;
      } else if (data.type === TRANSACTION_TYPE.TILL_NUMBER) {
        message += `Scan this QR with the M-PESA app to pay till to ${data.tillNumber} - KES ${data.amount}`;
      } else if (data.type === TRANSACTION_TYPE.AGENT) {
        message += `Scan this QR with the M-PESA app to withdraw from ${data.agentNumber} ${data.storeNumber} - KES ${data.amount}`;
      } else {
        message += "Scan this QR to pay";
      }
      message += `\n Generated by TeevoScan PesaQr`;

      const shareData: any = {
        title: "TeevoScan Pesa QR Code",
        text: message,
        files: [shareFile],
      };

      // Check if sharing files is supported
      if (navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback to sharing without files if file sharing is not supported
        const textOnlyShareData = {
          title: shareData.title,
          text: shareData.text,
        };

        if (navigator.canShare(textOnlyShareData)) {
          await navigator.share(textOnlyShareData);
        } else {
          throw new Error("Web Share not supported");
        }
      }

      // Cleanup
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error sharing QR code:", error);
      // Handle error appropriately (e.g., show toast message)
    }
  };

  return (
    <>
      <Head>
        <title>TeevoScan PesaQR | Generate Payment QR Codes</title>
      </Head>
      <HomeSEO />

      <div className="flex flex-col h-screen">
        <main className="flex-1 w-full bg-gray-900 ">
          <div className="px-4 md:px-0 mx-auto bg-gray-900 h-full text-white grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="flex justify-content  md:h-full w-11/12 mx-auto self-center pt-4 flex-col space-y-3">
              <div className="select-none  w-full flex items-center justify-between">
                <Link
                  href="/"
                  className="cursor-pointer flex w-fit justify-center md:justify-start  md:h-fit items-center space-x-2"
                >
                  <img src="/logo.svg" className="size-8 md:size-13" />
                  <div className="flex flex-col space-y-1">
                    <div className="font-display font-bold  text-xl md:text-5xl items-center flex text-white">
                      <span>TEEVOSCAN PESAQR</span>{" "}
                    </div>
                  </div>
                </Link>
                <div className="flex items-center space-x-3 justify-end">
                  <Link
                    href="https://github.com/DavidAmunga/pesaqr"
                    target="_blank"
                    className="text-white"
                  >
                    <FaGithub size={20} />
                  </Link>

                  <ColorPicker />

                  {showInstallBtn && (
                    <InstallButton handleInstall={handleInstallClick} />
                  )}
                </div>
              </div>

              {/* Form */}
              <PaymentDetails />
              {!data.hideAmount ? <NumPad /> : null}
            </div>
            <div
              style={{ background: data.color }}
              className={`relative h-full flex flex-col md:w-full w-11/12 rounded-md md:rounded-none mx-auto justify-start md:justify-center items-center`}
            >
              <div className="flex flex-col space-y-5 md:space-y-4 items-center md:w-4/5">
                <div className="py-4 flex items-center select-none w-full md:w-4/5 bg-black border-2 border-gray-800 px-4 rounded-md shadow-inner text-center text-white font-display  md:text-4xl">
                  <div className="border-2 border-gray-700 size-4 rounded-full bg-white"></div>
                  <Input
                    onChange={(e) => {
                      setData({ ...data, bannerText: e.target.value });
                    }}
                    value={
                      data.bannerText && data.bannerText.length > 0
                        ? data.bannerText
                        : "SCAN WITH M-PESA"
                    }
                    placeholder="Enter Banner Text"
                    className="flex-1 px-0 rounded-none  tracking-widest mx-auto w-full border-none  text-center bg-transparent text-white font-display text-xl md:text-4xl "
                  />
                  <div className="border-2 border-gray-400 size-4 rounded-full bg-white"></div>
                </div>
                <div className="w-full justify-center  flex items-center flex-col rounded-lg">
                  <QrSvg
                    value={generateQRCode(data) ?? ""}
                    className="p-4 border-[12px] border-black  md:w-2/4 bg-white rounded-md"
                  />
                  <div className="flex md:flex-row flex-col mt-4 w-full md:w-4/5 space-between gap-2 items-center">
                    <Button
                      onClick={handleQRCodeDownload}
                      type="button"
                      className="plausible-event-name=QR+Download bg-black w-full flex space-x-2 items-center text-xl md:text-3xl py-8 hover:bg-gray-700"
                    >
                      <HiOutlineDownload className="size-8" />
                      <span className="py-4">Download</span>
                    </Button>
                    <Button
                      type="button"
                      onClick={handleQRCodeShare}
                      disabled={!isShareSupported}
                      className={`plausible-event-name=QR+Share  py-8 text-xl md:text-4xl w-full md:w-4/5 flex items-center justify-center space-x-2 ${
                        isShareSupported
                          ? "bg-black hover:bg-gray-900 text-white"
                          : "bg-gray-700 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      <HiOutlineShare className="size-8" />
                      <span>Share</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
        <footer className="text-center py-2 font-display text-white">
          Built in 🇰🇪 by
          <Link
            href="https://twitter.com/davidamunga_"
            target="_blank"
            className="font-bold underline w-full text-center font-display ml-1"
          >
            Steve Omondi
          </Link>
        </footer>
      </div>
    </>
  );
};

export default HomeUI;
