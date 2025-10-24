'use client';
import { API_BASE_URL } from "@/services/api";

import Image from "next/image";
import "./page.css"
import { useState, useEffect, useCallback } from "react";
import { FaGoogle } from "react-icons/fa";
import Footer from "@/app/components/Header-Footer/Footer";
import {Icons} from "@/app/components/Icons/icons";
import Toastify from "@/app/components/Toastify/Toastify";
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';

import { useUserContext } from "@/context/UserContext";
import { signIn, useSession } from "next-auth/react";


export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useUserContext();
  const router = useRouter();
  const { data: session, status } = useSession();
  

  


  

  // Função para lidar com o clique no botão de login
  const handleLogin = async () => {

    // Verificar se os campos de email e senha foram preenchidos
    if (!email || !password) {
      toast.error('Por favor, preencha todos os campos.');
      return;
    }

    // Chamar a função de login
    try {
      await login(email, password);
      toast.success('Login realizado com sucesso!');
      router.push('/Home');
      console.log('Login realizado com sucesso!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(`Erro ao logar - ${errorMessage}`);
    }
  };


  
  return (
    <>
    <div className="LoginPage" >
      <Toastify />
      <div className="LoginContainer">
        <Image
          src="/logoBlack.svg"
          alt="Next.js logo"
          width={400}
          height={38}
          priority
        />
        <h1>Faça seu login</h1>
        <div className="Form">
          <label htmlFor="email"><Icons.ChefHat className="Icon"/>Email</label>
          <input type="email" id="email" name="email" required onChange={(e) => setEmail(e.target.value)} />
          <label htmlFor="password"><Icons.ChefHat className="Icon"/>Senha</label>
          <input type="password" id="password" name="password" required onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div className="LoginButtons">
          <button className="LoginButton" onClick={handleLogin}>Entrar</button>
          <button className="GoogleButton" onClick={() => signIn('google')}> <FaGoogle className="GoogleIcon" />Entre com o Google</button>
          <p>Não tem uma conta? Cadastre-se <a href="/Register">aqui</a> ou entre como <a href="/Home">Convidado</a></p>
        </div>
      </div>
        <Image
          src="/LoginMainPhoto.png"
          alt="Next.js logo"
          className="LoginMainPhoto"
          width={700}
          height={700}
          priority
        />

    </div>
    <Footer />
    </>
  );
}

