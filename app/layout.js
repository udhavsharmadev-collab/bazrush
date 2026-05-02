import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { SellerProvider } from './context/SellerContext';
import { DeliveryPartnerProvider } from './context/DeliveryPartnerContext'; 

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
  description: "Delivering essentials in 10-15 minutes. Futuristic speed with bold energy.",
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
                
                <Navbar />
                <main className="flex-1">{children}</main>
                <Footer />

              </DeliveryPartnerProvider>
            </CartProvider>
          </SellerProvider>
        </AuthProvider>
      </body>
    </html>
  );
}