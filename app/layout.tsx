import "./globals.css";
import type { ReactNode } from "react";
export const metadata={title:"THRYV — Share your world",description:"Connect, create and thrive."};
export default function RootLayout({children}:{children:ReactNode}){return <html lang="en"><body>{children}</body></html>}
