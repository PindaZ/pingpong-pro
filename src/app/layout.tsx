import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import { cn } from "@/lib/utils";
import Providers from "@/components/Providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PingPong'r",
  description: "Company Ping Pong Competition Manager",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className={cn(inter.className, "h-full bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100")} suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

