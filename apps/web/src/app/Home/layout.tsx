import Footer from "@/app/components/Header-Footer/Footer";
import Header from "@/app/components/Header-Footer/Header";
import React from "react";
import { UserProvider } from "@/context/UserContext";

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <div className="MainPage">
        <Header />
        {children}
        <Footer />
      </div>
    </UserProvider>
  );
}
