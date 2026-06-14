import { getServerLang } from "@/lib/server-lang";
import AuthForm from "@/components/auth/AuthForm";

export default function RegisterPage() {
  return <AuthForm mode="register" lang={getServerLang()} />;
}
