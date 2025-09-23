'use client';
import Image from "next/image";
import "./page.css"
import { useState } from "react";
import { useRouter } from 'next/navigation';
import Footer from "@/app/components/Header-Footer/Footer";
import Toastify from "@/app/components/Toastify/Toastify";
import { toast } from 'react-toastify';
import {Icons} from "@/app/components/Icons/icons";
import { useUserContext } from "@/context/UserContext";


export default function Register() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [admin] = useState(false);
  const { register } = useUserContext();
  const router = useRouter();


  const handleRegister = async () => {

    if (!email || !name || !password || !confirmPassword) {
      toast.error('Preencha todos os campos.');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem.');
      return;
    }

    const registerData = {
      email,
      name,
      password,
      admin
    }

    try {
      await register(name, email, password);
      console.log('newUser', registerData);
      toast.success('Cadastro realizado com sucesso!');

      //redirecionar para login
      router.push('/Login');
        
    } catch (error) {
      //toast exibindo o erro especifico
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(`Erro ao registrar usuário - ${errorMessage}`);
      
    }
  };

  return (
    <>
    <div className="RegisterPage" >
      <Toastify />
      <div className="RegisterSlogan">
        <Image
          src="/logoBlack.svg"
          alt="Next.js logo"
          className="RegisterMainPhoto"
          width={500}
          height={500}
          priority
        />
        <h1>Facilitando sua vida no dia a dia. Guiando sua cozinha com harmonia, <span>pensado para você!</span></h1>
      </div>

      <div className="RegisterContainer">

        <h1>Registre-se</h1>
        <div className="Form">
          <label htmlFor="email"><Icons.ChefHat className="icon" />Email</label>
          <input type="email" id="email" name="email" required onChange={(e) => setEmail(e.target.value)} />
          <label htmlFor="name"><Icons.ChefHat className="icon" />Nome</label>
          <input type="text" id="name" name="name" required onChange={(e) => setName(e.target.value)} />
          <label htmlFor="password"><Icons.ChefHat className="icon" />Senha</label>
          <input type="password" id="password" name="password" required onChange={(e) => setPassword(e.target.value)} />
          <label htmlFor="confirmPassword"><Icons.ChefHat className="icon" />Confirmar Senha</label>
          <input type="password" id="confirmPassword" name="confirmPassword" required onChange={(e) => setConfirmPassword(e.target.value)}/>
        </div>
        <div className="RegisterButtons">
          <button className="RegisterButton" onClick={handleRegister}>Registrar</button>
          <p>Voltar para <a href="/Login">Login</a> ou entre como <a href="/Home">Convidado</a></p>
        </div>
      </div>


    </div>
    <Footer />
    </>
  );
}