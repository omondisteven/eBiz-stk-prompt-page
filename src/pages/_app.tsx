// src/_app.tsx
import { AppProvider } from "@/context/AppContext";
import "../styles/globals.css";
import type { ReactElement, ReactNode } from "react";
import type { AppProps } from "next/app";
import type { NextPage } from "next";
import { Toaster } from "react-hot-toast";
import Script from "next/script";
import Layout from "@/components/Layout";

// Extend AppProps to support getLayout
export type NextPageWithLayout = NextPage & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

export default function App({ Component, pageProps }: AppPropsWithLayout) {
  const getLayout = Component.getLayout ?? ((page: ReactElement) => <Layout>{page}</Layout>);

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
        {getLayout(
          <>
            <Component {...pageProps} />
            <Toaster position="top-right" />
          </>
        )}
      </AppProvider>
    </>
  );
}
