import React from "react";
import { NextSeo } from "next-seo";

const HomeSEO = () => {
  const title = "eBiz | Generate Payment QR Codes and Short URLs";
  const description = "Generate Payment QR Codes";
  const url = `https://e-biz-mpesa-payment-app.vercel.app/`;
  const image = `https://pesaqr.com/ogimage.png`;
  const keywords = `till number,qr,qr code,stk,tinyurl`;

  return (
    <NextSeo
      title={title}
      description={description}
      canonical={url}
      openGraph={{
        url,
        title,
        description,
        images: [
          {
            url: `${image}`,
            width: 1200,
            height: 630,
            alt: "eBiz",
          },
        ],

        site_name: "eBiz",
      }}
      additionalMetaTags={[
        {
          name: "keywords",
          content: keywords,
        },
      ]}
      twitter={{
        handle: "@davidamunga_", // Replace with your Twitter handle
        site: "@davidamunga_", // Replace with your Twitter username
        cardType: "summary_large_image",
      }}
    />
  );
};

export default HomeSEO;
