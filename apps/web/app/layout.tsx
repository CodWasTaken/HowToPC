import type { Metadata } from "next";
import "./globals.css";

const description="Agent-native PC engineering configurator with deterministic compatibility, shared human-agent state, and a parametric Digital Twin.";

export const metadata: Metadata = {
  metadataBase:new URL("https://howtopc.vercel.app"),
  title:"HowToPC | Engineering Configurator",
  description,
  icons:{icon:"/favicon.ico",shortcut:"/favicon.ico",apple:"/howtopc-logo.png"},
  openGraph:{
    title:"HowToPC | Engineering Configurator",
    description,
    url:"https://howtopc.vercel.app",
    siteName:"HowToPC",
    type:"website",
    images:[{url:"/howtopc-og.jpg",width:1920,height:1080,alt:"HowToPC engineering configurator"}],
  },
  twitter:{card:"summary_large_image",title:"HowToPC | Engineering Configurator",description,images:["/howtopc-og.jpg"]},
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
