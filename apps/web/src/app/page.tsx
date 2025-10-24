"use client";
import Image from "next/image";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => {
      router.push("/Login");
    }, 5000);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div className="LandingPage">
      <Image
        src="/logoBlack.svg"
        alt="Next.js logo"
        width={180}
        height={38}
        priority
      />
    </div>
  );
}
