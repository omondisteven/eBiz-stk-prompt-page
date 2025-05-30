// src/_app.tsx
import { AppProvider } from "@/context/AppContext";
import "../styles/globals.css";
import type { AppProps } from "next/app";
import { Toaster } from "react-hot-toast";
import Script from "next/script";
import Layout from "@/components/Layout";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      {process.env.NODE_ENV === "production" && (
        <Script
          defer
          data-domain="pesaqr.com"
          src="https://analytics.davidamunga.com/js/script.js"
        />
      )}
      <AppProvider>
        <Layout>
          <Component {...pageProps} />
          <Toaster position="top-right" />
        </Layout>
      </AppProvider>
    </>
  );
}