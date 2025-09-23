"use client";

import Image from "next/image";
import Logo from "@/assets/logoBlack.svg";
import "./style.css";

import { useState } from "react";
import { FaUserCircle } from "react-icons/fa";
import { useUserContext } from "@/context/UserContext";



const Header = () => {
      const { user } = useUserContext();

  const { setActiveComponent } = useUserContext();
  const [sidebarOpen, setSidebarOpen] = useState(false);
    const { logout } = useUserContext();


  // Função para lidar com a navegação
  const handleNavigation = (component: string) => {
    setActiveComponent(component);
  };

  // Função para lidar com o logout
  const handleLogout = async () => {
    const confirmLogout = window.confirm("Deseja deslogar?");
    if (!confirmLogout) {
      return;
    }
    // Sign out from NextAuth and clear local session
    await logout();
  };

  // Função para lidar com os Navs 
  const Navigator = ({ classname }: { classname: string }) => {
    return (
      <div className={classname}>
        <button onClick={() => handleNavigation("component2")}>component2</button>
        <button onClick={() => handleNavigation("component3")}>component3</button>
        <button onClick={() => handleNavigation("component4")}>component4</button>
        <button onClick={() => handleNavigation("Perfil")}>Perfil</button>
      </div>
    );
  };

  return (
    <header>
      <Image
        src={Logo}
        alt="Logo"
        className="logo"
      />
      <div className="welcome">
      <h4>Bem-vindo, </h4>
      <span className="user">{user?.name}</span>
      </div>

      <Navigator classname="HeaderNav" />

      <button
        className="userButton"
        onClick={() => setSidebarOpen(true)}
        aria-label="Abrir menu do usuário"
      >
        <FaUserCircle />
      </button>
      {sidebarOpen && (
        <div
          className="SidebarNavOverlay"
          onClick={() => setSidebarOpen(false)}>
            <div className="SidebarNav">
              <span >{"Menu"}</span>
              <Navigator classname="SidebarNavContent" />

              <button className="sidebarButton" onClick={handleLogout}>
                Deslogar
              </button>
              <button
                className="sidebarButton Close"
                onClick={() => setSidebarOpen(false)}>
                Fechar
              </button>
            </div>
        </div>
      )}

    </header>
  );
};

export default Header;
