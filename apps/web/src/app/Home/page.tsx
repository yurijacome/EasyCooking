'use client';
import "./page.css"
import { useUserContext } from "@/context/UserContext";
import  Perfil  from "@/app/components/Perfil/Perfil";
import  RenderComponent2  from "@/app/components/component2/component";
import  RenderComponent3  from "@/app/components/component3/component";
import  RenderComponent4  from "@/app/components/component4/component";



// Componente principal que renderiza baseado no estado
function PageContent() {
  const { activeComponent } = useUserContext();

  const renderComponent = () => {
    switch (activeComponent) {
      case 'component4':
        return <RenderComponent4 />;
      case 'component2':
        return <RenderComponent2 />; 
      case 'component3':
        return <RenderComponent3 />; 
      case 'Perfil':
        return <Perfil />;
      default:
        return <RenderComponent2 />; 
    }
  };
    return (
    <>
        {renderComponent()}
    </>
  );
}

export default function HomePage() {
  return (
    <div >
      <PageContent />
    </div>
  );
}