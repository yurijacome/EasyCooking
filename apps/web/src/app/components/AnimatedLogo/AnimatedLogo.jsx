import Image from "next/image";
import "./animatedLogo.css";
import { useRouter } from "next/navigation";
import backgroundImage from "@/assets/background.png";

// Componente de Logo Pulsante na tela inicial

export default function AnimatedLogo() {
  const router = useRouter();

  //depois de 10 segundos redirecionar para a tela de login

  setTimeout(() => {
    router.push("/Login");
  }, 10000);

  return (
    <div className="animated-logo-container" style={{backgroundImage: `url(${backgroundImage.src})`,}}>
      <Image
        className="animated-logo"
        src="/logo.png"
        alt="logo"
        width={300}
        height={200}
        priority
        onClick={() => router.push("/Login")}
      />
    </div>
  );
}
