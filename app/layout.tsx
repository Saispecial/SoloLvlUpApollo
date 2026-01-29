import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "SoloLvlUp - EI Development Platform",
  description: "Evidence-based emotional intelligence development for nursing professionals",
  generator: "v0.dev",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0D9488",
}

import { TourOverlay } from "@/components/tour/TourOverlay"
import { ErrorBoundary } from "@/components/error-boundary"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased bg-[#F0FDFA]`}>
        <ErrorBoundary>
          {children}
          <TourOverlay />
        </ErrorBoundary>
      </body>
    </html>
  )
}
