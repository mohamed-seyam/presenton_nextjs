import React from "react";

import UploadPage from "./components/UploadPage";
import Header from "@/app/(presentation-generator)/dashboard/components/Header";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create | Slidegen - AI Presentation Generator",
  description:
    "Create stunning presentations with Slidegen's AI-powered platform. Multi-model support (OpenAI, Gemini, Ollama), custom layouts, and PDF/PPTX export.",
  alternates: {
    canonical: "https://slidegen.app/create",
  },
  keywords: [
    "presentation generator",
    "AI presentations",
    "data visualization",
    "automatic presentation maker",
    "professional slides",
    "data-driven presentations",
    "document to presentation",
    "presentation automation",
    "smart presentation tool",
    "business presentations",
  ],
  openGraph: {
    title: "Create | Slidegen - AI Presentation Generator",
    description:
      "Create stunning presentations with Slidegen's AI-powered platform. Multi-model support, custom layouts, and professional export options.",
    type: "website",
    url: "https://slidegen.app/create",
    siteName: "Slidegen",
  },
  twitter: {
    card: "summary_large_image",
    title: "Create | Slidegen - AI Presentation Generator",
    description:
      "Create stunning presentations with Slidegen's AI-powered platform. Multi-model support, custom layouts, and professional export options.",
  },
};

const page = () => {
  return (
    <div className="relative">
      <Header />
      <div className="flex flex-col items-center justify-center  py-8">
        <h1 className="text-3xl font-semibold font-instrument_sans">
          Create Presentation{" "}
        </h1>
        {/* <p className='text-sm text-gray-500'>We will generate a presentation for you</p> */}
      </div>

      <UploadPage />
    </div>
  );
};

export default page;
