import React, { useState } from 'react';
import { X, Mail, Lock, ShieldCheck, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, setIsAuthModalOpen, user, setUser, showToast } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleGoogleLogin = () => {
    setUser({
      name: 'Matheus Frote',
      email: 'matheusfrote3@gmail.com',
      isLoggedIn: true,
    });
    showToast('Login com Google realizado com sucesso!');
    setIsAuthModalOpen(false);
  };

  const validateEmail = (val: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !validateEmail(email.trim())) {
      showToast('Por favor, informe um e-mail válido.');
      return;
    }
    if (!password || password.length < 6) {
      showToast('A senha deve conter no mínimo 6 caracteres.');
      return;
    }
    const derivedName = email.split('@')[0];
    setUser({
      name: derivedName.charAt(0).toUpperCase() + derivedName.slice(1),
      email: email.trim(),
      isLoggedIn: true,
    });
    showToast(isRegistering ? 'Conta criada com sucesso!' : 'Login realizado com sucesso!');
    setIsAuthModalOpen(false);
  };

  const handlePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !validateEmail(email.trim())) {
      showToast('Digite um e-mail válido para redefinição.');
      return;
    }
    setResetEmailSent(true);
    showToast(`Instruções de redefinição enviadas para ${email.trim()}`);
  };

  const handleLogout = () => {
    setUser({
      name: 'Convidado',
      email: '',
      isLoggedIn: false,
    });
    showToast('Desconectado com sucesso.');
    setIsAuthModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 max-w-sm w-full space-y-5 shadow-2xl relative">
        <button
          onClick={() => {
            setIsAuthModalOpen(false);
            setIsForgotPassword(false);
            setResetEmailSent(false);
          }}
          className="absolute top-4 right-4 text-slate-500 hover:text-white p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        {user.isLoggedIn ? (
          <div className="text-center space-y-4 py-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Sua Conta</h3>
              <p className="text-xs text-slate-400 mt-0.5">{user.email || user.name}</p>
              <span className="inline-block mt-2 text-[10px] bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/20">
                Sincronização em nuvem ativa
              </span>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-2.5 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-400 rounded-xl text-xs font-bold transition-colors"
              >
                Sair da Conta
              </button>
            </div>
          </div>
        ) : isForgotPassword ? (
          /* Forgot password flow */
          <div className="space-y-4">
            <button
              onClick={() => {
                setIsForgotPassword(false);
                setResetEmailSent(false);
              }}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Voltar ao login
            </button>

            <div>
              <h3 className="text-lg font-black text-white tracking-tight">Recuperar Senha</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Digite seu e-mail para receber as instruções de redefinição.
              </p>
            </div>

            {resetEmailSent ? (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 text-center space-y-2">
                <span className="text-emerald-400 text-sm font-bold block">E-mail Enviado!</span>
                <p className="text-xs text-slate-300">
                  Verifique sua caixa de entrada em <strong>{email}</strong> com o link de recuperação.
                </p>
                <button
                  onClick={() => {
                    setIsForgotPassword(false);
                    setResetEmailSent(false);
                  }}
                  className="mt-2 text-xs font-bold text-emerald-400 hover:underline"
                >
                  Retornar ao login
                </button>
              </div>
            ) : (
              <form onSubmit={handlePasswordReset} className="space-y-3">
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="Seu e-mail cadastrado"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-lg shadow-emerald-500/20"
                >
                  Enviar Link de Recuperação
                </button>
              </form>
            )}
          </div>
        ) : (
          <>
            <div>
              <h3 className="text-lg font-black text-white tracking-tight">
                {isRegistering ? 'Criar sua Conta' : 'Entrar na sua Conta'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Sincronize seus cálculos, metas e histórico em todos os dispositivos.
              </p>
            </div>

            {/* Google Login Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-700 py-2.5 px-4 rounded-xl text-xs font-bold text-white transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continuar com o Google</span>
            </button>

            {/* Divider */}
            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-800 w-full" />
              <span className="bg-slate-900 px-3 text-[11px] text-slate-500 uppercase tracking-wider">
                ou com e-mail
              </span>
              <div className="border-t border-slate-800 w-full" />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="E-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Senha (mínimo 6 caracteres)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsForgotPassword(true)}
                  className="text-[11px] text-emerald-400/90 hover:underline"
                >
                  Esqueci minha senha
                </button>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setIsRegistering(!isRegistering)}
                  className="text-xs text-emerald-400 font-semibold hover:underline"
                >
                  {isRegistering ? 'Já tenho conta' : 'Criar conta'}
                </button>

                <button
                  type="submit"
                  className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-lg shadow-emerald-500/20"
                >
                  {isRegistering ? 'Cadastrar' : 'Entrar'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

