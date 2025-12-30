"use client";

import React from "react";
import Link from "next/link";
import { Layout, Plus } from "lucide-react";
import WakebLogo from "./WakebLogo";

const Header: React.FC = () => {
  return (
    <header className="w-full border-b bg-primary backdrop-blur supports-[backdrop-filter]:bg-primary/95 sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <WakebLogo width={120} height={30} />
          </Link>

          <nav className="flex items-center gap-4">
            <Link href="/custom-layout" className="inline-flex items-center gap-2 text-white hover:text-white/80">
              <Plus className="w-5 h-5" />
              <span className="text-sm font-medium font-inter">Create Template</span>
            </Link>
            <Link href="/template-preview" className="inline-flex items-center gap-2 text-white hover:text-white/80">
              <Layout className="w-5 h-5" />
              <span className="text-sm font-medium font-inter">Templates</span>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
