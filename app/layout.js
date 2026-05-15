import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { SellerProvider } from './context/SellerContext';
import { DeliveryPartnerProvider } from './context/DeliveryPartnerContext'; 
import { WishlistProvider } from "./context/Wishlistcontext"; // ← adjust path if needed

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Bazrush - Lightning Fast Delivery",
  description:
    "Delivering essentials in 20-25 minutes. Futuristic speed with bold energy.",

  applicationName: "Bazrush",

  openGraph: {
    title: "Bazrush - Lightning Fast Delivery",
    description:
      "Delivering essentials in 20-25 minutes. Futuristic speed with bold energy.",
    siteName: "Bazrush",
  },

  twitter: {
    card: "summary_large_image",
    title: "Bazrush - Lightning Fast Delivery",
    description:
      "Delivering essentials in 20-25 minutes. Futuristic speed with bold energy.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
    <body className="min-h-full flex flex-col bg-white">
        <AuthProvider>
          <SellerProvider>
            <CartProvider>
              <DeliveryPartnerProvider> 
                <WishlistProvider>
                  <Navbar />
                  <main className="flex-1">{children}</main>
                  <Footer />
                </WishlistProvider>
              </DeliveryPartnerProvider>
            </CartProvider>
          </SellerProvider>
        </AuthProvider>
      </body>
    </html>
  );
}