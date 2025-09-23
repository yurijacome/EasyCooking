import Image from "next/image";

export default function LandingPage() {

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
