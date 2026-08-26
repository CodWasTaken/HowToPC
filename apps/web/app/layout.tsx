import type { Metadata } from "next";
import "./globals.css";
export const metadata:Metadata={title:"HowToPC",description:"Agent-native PC and homelab engineering configurator"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>;}
