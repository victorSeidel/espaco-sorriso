import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { doAuxiliarLogin } from "@/actions/auxiliares/actions";

interface LoginModalProps { onLogin: (role: 'admin' | 'auxiliar', userId?: number) => void; }

const LoginModal = ({ onLogin }: LoginModalProps) => 
{
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => 
  {
    e.preventDefault();
    setIsLoading(true);

    const VerifyLogin = async () => 
    {
      return await doAuxiliarLogin(username.trim(), password.trim());
    }

    setTimeout(async () => 
    {
      if (username.trim() === "lucas" && password.trim() === "Anavitoria1")
      {
        onLogin('admin', 1);
        return;
      } 

      try 
      {
        const loginData = await VerifyLogin();
        onLogin('auxiliar', loginData.id);
      } 
      catch
      {
        alert('Erro ao fazer login. Verifique as credenciais e tente novamente.')
      }

      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">ES</span>
          </div>
          <CardTitle className="text-2xl">Espaço Sorriso</CardTitle>
          <p className="text-gray-600">Sistema de Gestão Odontológica</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Usuário</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginModal;
