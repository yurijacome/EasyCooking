
import { ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./style.css"
import {Icons} from "@/app/components/Icons/icons";


export default function Toastify() {
  return (
    <ToastContainer
      icon={({ type}) => {
        switch (type) {
            case 'info':
            return <Icons.ChefHat color ="var(--info)"/>;
            case 'error':
            return <Icons.ChefHat color="var(--error)" />;
            case 'success':
            return <Icons.ChefHat color="var(--success)" />;
            case 'warning':
            return <Icons.ChefHat color="var(--warning)" />;
            default:
            return null;
        }
      }}
    />  
  );
}