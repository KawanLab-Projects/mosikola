import { assetURL } from '@/lib/api'

export type CanvasElementProps = {
    x: number;
    y: number;
    width: number;
    height: number;
    visible: boolean;
    color?: string;
    fontSize?: number;
    fontWeight?: string;
    fontFamily?: string;
    text?: string;
    shape?: 'box' | 'circle';
    borderRadius?: number;
}

export type CanvasState = {
    photo: CanvasElementProps;
    name: CanvasElementProps;
    nisn: CanvasElementProps;
    birth_info: CanvasElementProps;
    address: CanvasElementProps;
    barcode: CanvasElementProps;
    qr_code: CanvasElementProps;
    logo: CanvasElementProps;
    school_name: CanvasElementProps;
    back_text: CanvasElementProps;
    back_logo: CanvasElementProps;
    back_school_name: CanvasElementProps;
    back_nama_kepala_sekolah: CanvasElementProps;
    back_nip_kepala_sekolah: CanvasElementProps;
}

interface IdCardPrintCanvasProps {
    side: 'front' | 'back';
    layout: 'vertical' | 'horizontal' | 'portrait' | 'landscape';
    backgroundUrl: string | null;
    canvasState: CanvasState;
    inlineFontCss?: string; // Pre-fetched font CSS with base64 encoded fonts
    studentData: {
        name: string;
        nisn: string;
        birth_place?: string;
        birth_date?: string;
        address?: string;
        photo_url?: string;
    };
    schoolData: {
        name: string;
        address: string;
        principal_name: string;
        principal_nip: string;
        logo_url: string | null;
    };
}

const CANVAS_PORTRAIT = { width: 400, height: 600 }
const CANVAS_LANDSCAPE = { width: 600, height: 400 }

// Global reset styles injected into the canvas to prevent Tailwind leakage
const RESET_STYLE = `
    * {
        border: none !important;
        outline: none !important;
        box-shadow: none !important;
        box-sizing: border-box;
    }
`


export default function IdCardPrintCanvas({
    side,
    layout,
    backgroundUrl,
    canvasState,
    inlineFontCss = '',
    studentData,
    schoolData
}: IdCardPrintCanvasProps) {
    const isPortrait = layout === 'vertical' || layout === 'portrait';
    const dim = isPortrait ? CANVAS_PORTRAIT : CANVAS_LANDSCAPE;

    const formatBirthInfo = () => {
        if (canvasState.birth_info?.text) return canvasState.birth_info.text;
        const place = studentData.birth_place || '-';
        const date = studentData.birth_date ? new Date(studentData.birth_date).toLocaleDateString('id-ID') : '-';
        return `${place}, ${date}`;
    };

    /**
     * Smart text fitter: Abbreviates middle/last names if text overflows.
     * If even the abbreviated text overflows, it calculates a scaleX factor to squish it.
     */
    const getAutoFitTextAndTransform = (originalText: string, boxWidth: number, fontSize: number, allowAbbreviation: boolean = true): { text: string, transform: string } => {
        if (!originalText || !boxWidth || !fontSize) return { text: originalText, transform: 'none' };

        const avgCharWidth = fontSize * 0.58;

        // 1. Try original text
        let estimatedWidth = originalText.length * avgCharWidth;
        if (estimatedWidth <= boxWidth) {
            return { text: originalText, transform: 'none' };
        }

        let abbreviatedText = originalText;
        let scaleFactor = 1;

        // 2. Abbreviation Logic (shorten middle words first, then last name) - only if allowed
        if (allowAbbreviation) {
            const words = originalText.trim().split(/\s+/);
            if (words.length > 2) {
                const candidateWords = [...words];
                // First pass: abbreviate middle names left-to-right
                for (let i = 1; i < candidateWords.length - 1; i++) {
                    if (candidateWords[i].length > 1) {
                        candidateWords[i] = candidateWords[i].charAt(0) + ".";
                    }
                    const candidateText = candidateWords.join(" ");
                    if (candidateText.length * avgCharWidth <= boxWidth) {
                        abbreviatedText = candidateText;
                        break;
                    }
                    abbreviatedText = candidateText;
                }

                // If it STILL doesn't fit after all middle names are abbreviated, abbreviate the last name too
                if (abbreviatedText.length * avgCharWidth > boxWidth) {
                    const lastIdx = candidateWords.length - 1;
                    if (candidateWords[lastIdx].length > 1) {
                        candidateWords[lastIdx] = candidateWords[lastIdx].charAt(0) + ".";
                    }
                    abbreviatedText = candidateWords.join(" ");
                }
            } else if (words.length === 2 && words[1].length > 1) {
                // For 2 words, abbreviate the second word
                const candidateText = words[0] + " " + words[1].charAt(0) + ".";
                abbreviatedText = candidateText;
            }
        }

        // 3. Final Squish Check (if abbreviated/original text STILL overflows)
        estimatedWidth = abbreviatedText.length * avgCharWidth;
        if (estimatedWidth > boxWidth) {
            scaleFactor = Math.max(0.6, boxWidth / estimatedWidth);
            return { text: abbreviatedText, transform: `scaleX(${scaleFactor})` };
        }

        return { text: abbreviatedText, transform: 'none' };
    };

    const getFullUrl = (path?: string | null) => {
        if (!path) return '';
        let targetUrl = path;

        // If it's already a full URL, use it directly.
        // Otherwise, construct from assetURL.
        if (!path.startsWith('http')) {
            const cleanPath = path.startsWith('/') ? path : `/${path}`;
            if (cleanPath.startsWith('/storage/')) {
                targetUrl = `${assetURL}${cleanPath}`;
            } else {
                targetUrl = `${assetURL}/storage${cleanPath}`;
            }
        }

        // Proxy through NextJS to bypass dom-to-image CORS completely
        return `/api/proxy-image?url=${encodeURIComponent(targetUrl)}`;
    };

    const safeColor = (color?: string) =>
        (color && !color.includes('var(') && !color.includes('oklch') && !color.includes('lab(')) ? color : '#000000';

    return (
        <div
            style={{
                width: dim.width,
                height: dim.height,
                position: 'relative',
                overflow: 'hidden',
                backgroundColor: 'white',
                color: '#000000',
                fontFamily: 'sans-serif',
                // Explicitly set no border/outline on the root
                border: 'none',
                outline: 'none',
                boxShadow: 'none',
            }}
        >
            {/* Inject CSS reset and proxied fonts as inline base64 — prevents Tailwind leakage and ensures correct fonts in dom-to-image */}
            <style dangerouslySetInnerHTML={{ __html: RESET_STYLE + inlineFontCss }} />

            {/* Background image rendered as an absolutely positioned img to avoid CSS background-image proxying issues */}
            {backgroundUrl && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                    src={getFullUrl(backgroundUrl)}
                    alt=""
                    aria-hidden="true"
                    crossOrigin="anonymous"
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: 'center',
                        zIndex: 0,
                        border: 'none',
                        outline: 'none',
                    }}
                />
            )}

            {/* All card content sits above background at z:1 */}
            <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>

                {side === 'front' && (
                    <>
                        {/* PHOTO */}
                        {canvasState.photo?.visible && studentData.photo_url && (
                            <div
                                style={{
                                    position: 'absolute',
                                    left: canvasState.photo.x,
                                    top: canvasState.photo.y,
                                    width: canvasState.photo.width,
                                    height: canvasState.photo.height,
                                    // Apply border radius from canvasState
                                    borderRadius: canvasState.photo.shape === 'circle'
                                        ? '50%'
                                        : `${canvasState.photo.borderRadius || 0}px`,
                                    overflow: 'hidden',
                                    border: 'none',
                                    outline: 'none',
                                }}
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={getFullUrl(studentData.photo_url)}
                                    alt="Student Photo"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', border: 'none', outline: 'none' }}
                                    crossOrigin="anonymous"
                                />
                            </div>
                        )}

                        {/* QR CODE */}
                        {canvasState.qr_code?.visible && (
                            <div
                                style={{
                                    position: 'absolute',
                                    left: canvasState.qr_code.x,
                                    top: canvasState.qr_code.y,
                                    width: canvasState.qr_code.width,
                                    height: canvasState.qr_code.height,
                                    border: 'none',
                                    outline: 'none',
                                }}
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={getFullUrl(`https://api.qrserver.com/v1/create-qr-code/?size=${canvasState.qr_code.width}x${canvasState.qr_code.height}&data=${studentData.nisn}`)}
                                    alt="QR Code"
                                    crossOrigin="anonymous"
                                    style={{ width: '100%', height: '100%', objectFit: 'contain', border: 'none', outline: 'none' }}
                                />
                            </div>
                        )}

                        {/* BARCODE */}
                        {canvasState.barcode?.visible && (
                            <div
                                style={{
                                    position: 'absolute',
                                    left: canvasState.barcode.x,
                                    top: canvasState.barcode.y,
                                    width: canvasState.barcode.width,
                                    height: canvasState.barcode.height,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: 'none',
                                    outline: 'none',
                                }}
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={getFullUrl(`https://bwipjs-api.metafloor.com/?bcid=code128&text=${studentData.nisn}&scale=2&includetext=false`)}
                                    alt="Barcode"
                                    crossOrigin="anonymous"
                                    style={{ width: '100%', height: '100%', objectFit: 'fill', border: 'none', outline: 'none' }}
                                />
                            </div>
                        )}

                        {/* LOGO */}
                        {canvasState.logo?.visible && schoolData.logo_url && (
                            <div
                                style={{
                                    position: 'absolute',
                                    left: canvasState.logo.x,
                                    top: canvasState.logo.y,
                                    width: canvasState.logo.width,
                                    height: canvasState.logo.height,
                                    borderRadius: canvasState.logo.shape === 'circle' ? '50%' : `${canvasState.logo.borderRadius || 0}px`,
                                    overflow: 'hidden',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: 'none',
                                    outline: 'none',
                                }}
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={getFullUrl(schoolData.logo_url)}
                                    alt="School Logo"
                                    crossOrigin="anonymous"
                                    style={{ width: '100%', height: '100%', objectFit: 'contain', border: 'none', outline: 'none' }}
                                />
                            </div>
                        )}

                        {/* SCHOOL NAME */}
                        {canvasState.school_name?.visible && (() => {
                            const originalText = canvasState.school_name.text || schoolData.name;
                            const { text: fittedText, transform } = getAutoFitTextAndTransform(originalText, (canvasState.school_name.width || 100) - 12, canvasState.school_name.fontSize || 16, false);
                            return (
                                <div
                                    style={{
                                        position: 'absolute',
                                        left: canvasState.school_name.x,
                                        top: canvasState.school_name.y,
                                        width: canvasState.school_name.width,
                                        height: canvasState.school_name.height,
                                        color: safeColor(canvasState.school_name.color),
                                        fontSize: `${canvasState.school_name.fontSize || 16}px`,
                                        fontWeight: canvasState.school_name.fontWeight || 'bold',
                                        fontFamily: canvasState.school_name.fontFamily || 'sans-serif',
                                        display: 'flex',
                                        alignItems: 'center',
                                        border: 'none',
                                        outline: 'none',
                                        backgroundColor: 'transparent',
                                        padding: '2px 6px',
                                        whiteSpace: 'nowrap',
                                        transformOrigin: 'left center',
                                        transform: transform,
                                    }}
                                >
                                    {fittedText}
                                </div>
                            );
                        })()}

                        {/* TEXT ELEMENTS */}
                        {[
                            { key: 'name', value: studentData.name },
                            { key: 'nisn', value: studentData.nisn },
                            { key: 'birth_info', value: formatBirthInfo() },
                            { key: 'address', value: studentData.address || '-' }
                        ].map(({ key, value }) => {
                            const el = canvasState[key as keyof CanvasState] as CanvasElementProps | undefined;
                            if (!el?.visible) return null;
                            const displayValue = el.text || value;
                            const { text: fittedText, transform } = getAutoFitTextAndTransform(displayValue, (el.width || 100) - 12, el.fontSize || 14);
                            return (
                                <div
                                    key={key}
                                    style={{
                                        position: 'absolute',
                                        left: el.x,
                                        top: el.y,
                                        width: el.width,
                                        height: el.height,
                                        color: safeColor(el.color),
                                        backgroundColor: 'transparent',
                                        fontSize: `${el.fontSize || 14}px`,
                                        fontWeight: el.fontWeight || 'normal',
                                        fontFamily: el.fontFamily || 'sans-serif',
                                        textTransform: key === 'name' ? 'uppercase' : 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        whiteSpace: 'nowrap',
                                        border: 'none',
                                        outline: 'none',
                                        padding: '2px 6px',
                                        transformOrigin: 'left center',
                                        transform: transform,
                                    }}
                                >
                                    {fittedText}
                                </div>
                            )
                        })}
                    </>
                )}

                {side === 'back' && (
                    <>
                        {/* BACK LOGO */}
                        {canvasState.back_logo?.visible && schoolData.logo_url && (
                            <div
                                style={{
                                    position: 'absolute',
                                    left: canvasState.back_logo.x,
                                    top: canvasState.back_logo.y,
                                    width: canvasState.back_logo.width,
                                    height: canvasState.back_logo.height,
                                    borderRadius: canvasState.back_logo.shape === 'circle' ? '50%' : `${canvasState.back_logo.borderRadius || 0}px`,
                                    overflow: 'hidden',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: 'none',
                                    outline: 'none',
                                }}
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={getFullUrl(schoolData.logo_url)}
                                    alt="School Logo"
                                    crossOrigin="anonymous"
                                    style={{ width: '100%', height: '100%', objectFit: 'contain', border: 'none', outline: 'none' }}
                                />
                            </div>
                        )}

                        {/* TEXT BLOCKS */}
                        {[
                            { key: 'back_school_name', value: schoolData.name },
                            { key: 'back_nama_kepala_sekolah', value: schoolData.principal_name },
                            { key: 'back_nip_kepala_sekolah', value: `NIP. ${schoolData.principal_nip}` },
                            { key: 'back_text', value: canvasState.back_text?.text || 'Teks Belakang' }
                        ].map(({ key, value }) => {
                            const el = canvasState[key as keyof CanvasState] as CanvasElementProps | undefined;
                            if (!el?.visible) return null;
                            const originalText = el.text || value;

                            // Do not abbreviate the school name on the back either.
                            const allowAbbrev = key !== 'back_school_name';

                            const { text: fittedText, transform } = key !== 'back_text'
                                ? getAutoFitTextAndTransform(originalText, (el.width || 100) - 12, el.fontSize || 14, allowAbbrev)
                                : { text: originalText, transform: 'none' };

                            return (
                                <div
                                    key={key}
                                    style={{
                                        position: 'absolute',
                                        left: el.x,
                                        top: el.y,
                                        width: el.width,
                                        height: el.height,
                                        color: safeColor(el.color),
                                        backgroundColor: 'transparent',
                                        fontSize: `${el.fontSize || 14}px`,
                                        fontWeight: el.fontWeight || 'normal',
                                        fontFamily: el.fontFamily || 'sans-serif',
                                        whiteSpace: key === 'back_text' ? 'pre-wrap' : 'nowrap',
                                        overflow: 'hidden',
                                        border: 'none',
                                        outline: 'none',
                                        padding: '2px 6px',
                                        transformOrigin: 'center center',
                                        transform: transform,
                                    }}
                                >
                                    {fittedText}
                                </div>
                            )
                        })}
                    </>
                )}
            </div>
        </div>
    )
}
