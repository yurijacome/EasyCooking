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



  const handleNavigation = (component: string) => {
    setActiveComponent(component);
  };

  const handleLogout = async () => {
    const confirmLogout = window.confirm("Deseja deslogar?");
    if (!confirmLogout) {
      return;
    }
    // Sign out from NextAuth
    await logout();
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

      <nav>
        <button
          onClick={() => handleNavigation("component2")}
          className="NavButton"
        >
          component
        </button>
        <button
          onClick={() => handleNavigation("component3")}
          className="NavButton"
        >
          component2
        </button>
        <button
          onClick={() => handleNavigation("component4")}
          className="NavButton"
        >
          component3
        </button>
        <button
          onClick={() => handleNavigation("Perfil")}
          className="NavButton"
        >
          Perfil
        </button>
      </nav>

      <button
        className="userButton"
        onClick={() => setSidebarOpen(true)}
        aria-label="Abrir menu do usuário"
      >
        <FaUserCircle />
      </button>
      {sidebarOpen && (
        <div
          className="sidebarOverlay"
          onClick={() => setSidebarOpen(false)}
        >
          <aside className="sidebar" onClick={(e) => e.stopPropagation()}>
            <span className="sidebarSpan">{"Menu"}</span>

        <button
          onClick={() => handleNavigation("Perfil")}
          className="sidebarButton"
        >
          Perfil
        </button>
        <button
          onClick={() => handleNavigation("component2")}
          className="sidebarButton"
        >
          component2
        </button>
        <button
          onClick={() => handleNavigation("component3")}
          className="sidebarButton"
        >
          component3
        </button>
        <button
          onClick={() => handleNavigation("component4")}
          className="sidebarButton"
        >
          component4
        </button>

            <button className="sidebarButton" onClick={handleLogout}>
              Deslogar
            </button>

            <button
              className="sidebarButton Close"
              onClick={() => setSidebarOpen(false)}
            >
              Fechar
            </button>
          </aside>
        </div>
      )}

    </header>
  );
};

export default Header;
