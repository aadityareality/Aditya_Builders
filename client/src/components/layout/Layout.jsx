import { Outlet } from "react-router-dom";
import Header from "./Header.jsx";
import Footer from "./Footer.jsx";
import WhatsAppFloatingButton from "../ui/WhatsAppFloatingButton.jsx";

export default function Layout() {
  return (
    <div className="flex flex-col min-h-screen bg-[#FFFBF5] text-[#2E2A26] font-sans">
      <Header />
      
      {/* Page view content mounts here */}
      <main className="flex-grow">
        <Outlet />
      </main>

      <WhatsAppFloatingButton />

      <Footer />
    </div>
  );
}
