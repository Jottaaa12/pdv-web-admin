import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext"; // <-- Importar

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PDV Web Admin",
  description: "Gerenciador do PDV Açaí",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider> {/* <-- Envolver aqui */}
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
