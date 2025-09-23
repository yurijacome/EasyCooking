"use client";

import { SessionProvider } from "next-auth/react";
import  ThemeProvider from "@/context/ThemeContext";
import { UserProvider } from "@/context/UserContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider/>
      <UserProvider>
        {children}
      </UserProvider>
    </SessionProvider>
  );
}
