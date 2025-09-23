"use client";
import { useUserContext } from "@/context/UserContext";
import { useState, useEffect } from "react";

// Renderização principal do componente
const Perfil = () => {
  const { user } = useUserContext();
  const [editMode, setEditMode] = useState(false);
  const [newName, setNewName] = useState(user?.name || "");
  const [newEmail, setNewEmail] = useState(user?.email || "");

  // Update state when user data changes
  useEffect(() => {
    if (user) {
      setNewName(user.name);
      setNewEmail(user.email);
    }
  }, [user]);

  // Função para ativar o modo de edição
  const handleEdit = () => {
    setEditMode(true);
  };

  // Função para salvar as alterações
  const handleSave = () => {

    setEditMode(false);
  };

  // Função para cancelar as alterações
  const handleCancel = () => {
    setEditMode(false);
  };

  return (
    <div>
      <h1>Perfil</h1>
      {editMode ? (
        <>
          <button onClick={handleSave}>Salvar</button>
          <button onClick={handleCancel}>Cancelar</button>
        </>
      ) : (
      <button onClick={handleEdit}>Editar</button>
      )}

      <div>
        <p>Nome:</p>
        {editMode ? (
          <input
            type="text"
            value={user?.name || ""}
            onChange={(e) => setNewName(e.target.value)}
          />
        ) : (
          <span>{user?.name || "N/A"}</span>
        )}
      </div>

      <div>
        <p>Email:</p>
        {editMode ? (
          <input
            type="email"
            value={user?.email || ""}
            onChange={(e) => setNewEmail(e.target.value)}
          />
        ) : (
          <span>{user?.email || "N/A"}</span>
        )}
      </div>
    </div>
  );
};

export default Perfil;
