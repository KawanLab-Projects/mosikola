"use client"

import { useEffect } from "react"
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode"

export default function QrScanner({
    onScan,
    facingMode,
    id = "qr-reader",
}: {
    onScan: (text: string) => void
    facingMode: "environment" | "user"
    id?: string
}) {
    useEffect(() => {
        let html5QrCode: Html5Qrcode | null = null;
        let isComponentMounted = true;

        const startScanner = async () => {
            await new Promise((resolve) => setTimeout(resolve, 50)); // Small delay for React Strict Mode
            if (!isComponentMounted) return;

            try {
                html5QrCode = new Html5Qrcode(id, {
                    verbose: false,
                    formatsToSupport: [
                        Html5QrcodeSupportedFormats.QR_CODE,
                        Html5QrcodeSupportedFormats.CODE_128,
                        Html5QrcodeSupportedFormats.CODE_39,
                        Html5QrcodeSupportedFormats.EAN_13,
                        Html5QrcodeSupportedFormats.EAN_8,
                        Html5QrcodeSupportedFormats.UPC_A,
                    ],
                });

                await html5QrCode.start(
                    { facingMode },
                    {
                        fps: 10,
                        qrbox: 250,
                    },
                    (decodedText) => {
                        if (isComponentMounted) onScan(decodedText);
                    },
                    () => {
                        // Ignore standard frame errors to prevent console spam
                    }
                );
            } catch (err) {
                if (isComponentMounted) {
                    console.error("Failed to start QR scanner", err);
                }
            }
        };

        startScanner();

        return () => {
            isComponentMounted = false;
            if (html5QrCode) {
                // Determine if we need to stop
                if (html5QrCode.isScanning) {
                    html5QrCode.stop().then(() => {
                        try {
                            html5QrCode?.clear();
                        } catch { } // Ignore DOM errors on unmount
                    }).catch(() => { });
                } else {
                    try {
                        html5QrCode.clear();
                    } catch { }
                }
            }
        };
    }, [facingMode, onScan, id]);

    return <div id={id} className="w-full h-full" />
}
