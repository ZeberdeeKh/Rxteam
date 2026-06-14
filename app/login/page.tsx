import { getServerLang } from "@/lib/server-lang";
import AuthForm from "@/components/auth/AuthForm";

export default function LoginPage() {
  return <AuthForm mode="login" lang={getServerLang()} />;
}
