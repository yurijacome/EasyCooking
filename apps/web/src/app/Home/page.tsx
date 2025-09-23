'use client';
import "./page.css"
import { useUserContext } from "@/context/UserContext";
import  RenderComponent  from "@/app/components/component/component";
import  RenderComponent2  from "@/app/components/component2/component";
import  RenderComponent3  from "@/app/components/component3/component";
import  RenderComponent4  from "@/app/components/component4/component";



// Componente principal que renderiza baseado no estado
function PageContent() {
  const { activeComponent } = useUserContext();

  const renderComponent = () => {
    switch (activeComponent) {
      case 'component':
        return <RenderComponent />;
      case 'component2':
        return <RenderComponent2 />; 
      case 'component3':
        return <RenderComponent3 />; 
      case 'component4':
        return <RenderComponent4 />;
      default:
        return <RenderComponent />; 
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