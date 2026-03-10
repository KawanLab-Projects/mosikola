import { Geist, Geist_Mono, Outfit, Lato, Montserrat, Nunito, Poppins, Raleway, Roboto } from "next/font/google";
import "./globals.css";
import ClientLayout from "./components/layouts/ClientLayout";
import { Toaster } from "sonner";

const outfit = Outfit({ subsets: ['latin'], variable: '--font-sans' });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const lato = Lato({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-lato' });
const montserrat = Montserrat({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-montserrat' });
const nunito = Nunito({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-nunito' });
const poppins = Poppins({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-poppins' });
const raleway = Raleway({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-raleway' });
const roboto = Roboto({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-roboto' });

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mosikola",
  description: "Membangun Sekolah yang Lebih Transparan",
};

import QueryProvider from "./components/QueryProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${lato.variable} ${montserrat.variable} ${nunito.variable} ${poppins.variable} ${raleway.variable} ${roboto.variable}`}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <QueryProvider>
          <ClientLayout>{children}</ClientLayout>
        </QueryProvider>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
