import React, { useState } from 'react';
import { X, Mail, Lock, ShieldCheck, Eye, EyeOff, ArrowLeft, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  loginWithGoogle,
  loginWithEmail,
  registerWithEmail,
  resetPassword,
  logoutFirebase,
} from '../services/firebase';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, setIsAuthModalOpen, user, showToast } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const isLocked = lockoutUntil !== null && Date.now() < lockoutUntil;
  const remainingSeconds = lockoutUntil ? Math.max(0, Math.ceil((lockoutUntil - Date.now()) / 1000)) : 0;

  const handleGoogleLogin = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    if (isLoading) return;
    if (isLocked) {
      showToast(`Muitas tentativas. Aguarde ${remainingSeconds} segundos.`);
      return;
    }
    setIsLoading(true);
    try {
      const fbUser = await loginWithGoogle();
      setPassword('');
      setFailedAttempts(0);
      setLockoutUntil(null);
      showToast(`Bem-vindo, ${fbUser.displayName || fbUser.email?.split('@')[0] || 'Usuário'}!`);
      setIsAuthModalOpen(false);
    } catch (err: any) {
      if (
        err?.code === 'auth/unauthorized-domain' ||
        err?.code === 'auth/popup-closed-by-user' ||
        err?.code === 'auth/cancelled-popup-request'
      ) {
        console.warn('Google auth notice:', err?.code || err?.message);
      } else {
        console.error('Google auth error:', err);
      }
      if (err?.code === 'auth/popup-closed-by-user') {
        showToast('Login cancelado.');
      } else if (err?.code === 'auth/popup-blocked') {
        showToast('O pop-up de login foi bloqueado pelo navegador. Por favor, permita pop-ups.');
      } else if (err?.code === 'auth/unauthorized-domain') {
        showToast('Serviço de autenticação temporariamente indisponível. Tente novamente em instantes.');
      } else if (err?.code === 'auth/network-request-failed') {
        showToast('Falha de conexão com o serviço de login. Verifique sua rede.');
      } else if (err?.code === 'auth/internal-error') {
        showToast('Erro de comunicação. Verifique se pop-ups estão permitidos.');
      } else {
        showToast(err?.message || 'Erro ao autenticar com o Google. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const validateEmail = (val: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) && val.length <= 100;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) {
      showToast(`Acesso temporariamente bloqueado. Aguarde ${remainingSeconds} segundos.`);
      return;
    }

    const cleanEmail = email.trim();
    if (!cleanEmail || !validateEmail(cleanEmail)) {
      const nextFail = failedAttempts + 1;
      setFailedAttempts(nextFail);
      if (nextFail >= 5) {
        setLockoutUntil(Date.now() + 60 * 1000);
        showToast('Muitas tentativas inválidas. Bloqueado por 60 segundos.');
      } else {
        showToast('Por favor, informe um e-mail válido.');
      }
      return;
    }

    if (!password || password.length < 6) {
      showToast('A senha deve conter no mínimo 6 caracteres.');
      return;
    }

    if (password.length > 128) {
      showToast('A senha excede o limite máximo permitido de 128 caracteres.');
      return;
    }

    setIsLoading(true);
    try {
      if (isRegistering) {
        const derivedName = cleanEmail.split('@')[0].slice(0, 40);
        await registerWithEmail(cleanEmail, password, derivedName.charAt(0).toUpperCase() + derivedName.slice(1));
        showToast('Conta criada com sucesso!');
      } else {
        await loginWithEmail(cleanEmail, password);
        showToast('Login realizado com sucesso!');
      }
      setPassword('');
      setFailedAttempts(0);
      setLockoutUntil(null);
      setIsAuthModalOpen(false);
    } catch (err: any) {
      console.error('Email auth error:', err);
      if (err?.code === 'auth/operation-not-allowed') {
        showToast('E-mail/senha não habilitado no Firebase. Conecte-se com o Google!');
      } else if (err?.code === 'auth/email-already-in-use') {
        showToast('Este e-mail já está em uso. Tente fazer login ou use o Google.');
      } else if (
        err?.code === 'auth/user-not-found' ||
        err?.code === 'auth/wrong-password' ||
        err?.code === 'auth/invalid-credential'
      ) {
        const nextFail = failedAttempts + 1;
        setFailedAttempts(nextFail);
        if (nextFail >= 5) {
          setLockoutUntil(Date.now() + 60 * 1000);
          showToast('Credenciais incorretas. Bloqueado por 60s.');
        } else {
          showToast('E-mail ou senha incorretos.');
        }
      } else if (err?.code === 'auth/weak-password') {
        showToast('A senha é muito fraca.');
      } else {
        showToast(err?.message || 'Erro ao realizar login.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) {
      showToast(`Aguarde ${remainingSeconds}s.`);
      return;
    }
    const cleanEmail = email.trim();
    if (!cleanEmail || !validateEmail(cleanEmail)) {
      showToast('Digite um e-mail válido para redefinição.');
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(cleanEmail);
      setResetEmailSent(true);
      showToast(`Instruções de redefinição enviadas para ${cleanEmail}`);
    } catch (err: any) {
      if (err?.code === 'auth/user-not-found') {
        showToast('E-mail não cadastrado.');
      } else if (err?.code === 'auth/operation-not-allowed') {
        showToast('Recuperação de e-mail não disponível. Use o login com o Google.');
      } else {
        showToast('Falha ao enviar e-mail de redefinição.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logoutFirebase();
      setPassword('');
      showToast('Desconectado com sucesso.');
      setIsAuthModalOpen(false);
    } catch {
      showToast('Erro ao sair da conta.');
    } finally {
      setIsLoading(false);
    }
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
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.name}
                className="w-14 h-14 rounded-full mx-auto border-2 border-emerald-500/40 object-cover shadow-md"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
            )}
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
                disabled={isLoading}
                className="w-full py-2.5 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-400 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Sair da Conta</span>
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
                    disabled={isLoading}
                    placeholder="Seu e-mail cadastrado"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none disabled:opacity-50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Enviar Link de Recuperação</span>
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
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2.5 bg-slate-950 hover:bg-slate-850 disabled:opacity-50 border border-slate-700 py-2.5 px-4 rounded-xl text-xs font-bold text-white transition-colors"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
              ) : (
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
              )}
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
                  disabled={isLoading}
                  placeholder="E-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none disabled:opacity-50"
                />
              </div>

              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={isLoading}
                  placeholder="Senha (mínimo 6 caracteres)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none disabled:opacity-50"
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
                  disabled={isLoading}
                  className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5"
                >
                  {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isRegistering ? 'Cadastrar' : 'Entrar'}</span>
                </button>
              </div>

              <div className="pt-3 border-t border-slate-800/80 text-center">
                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(false)}
                  className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Continuar sem login (salvar apenas neste dispositivo)
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

