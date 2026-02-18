'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Lock, Mail, CheckCircle2, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from '@/components/logo';

const StatusModal = ({ type, message, onClose }: { type: 'success' | 'error' | null, message: string, onClose: () => void }) => {
  if (!type) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 shadow-2xl max-w-sm w-full text-center border border-zinc-100 dark:border-zinc-800"
      >
        <div className={`mx-auto w-20 h-20 rounded-3xl flex items-center justify-center mb-6 ${
          type === 'success' ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-500'
        }`}>
          {type === 'success' ? <CheckCircle2 className="w-10 h-10" /> : <XCircle className="w-10 h-10" />}
        </div>
        <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
          {type === 'success' ? 'Berhasil Masuk!' : 'Login Gagal'}
        </h3>
        <p className="text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed">
          {message}
        </p>
        <Button 
          onClick={onClose}
          className={`w-full h-12 rounded-2xl font-bold transition-all duration-300 ${
            type === 'success' 
            ? 'bg-emerald-500 hover:bg-emerald-600 text-white' 
            : 'bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-50 dark:text-zinc-900'
          }`}
        >
          {type === 'success' ? 'Tunggu sebentar...' : 'Pahami & Coba Lagi'}
        </Button>
      </motion.div>
    </div>
  );
};

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, setAuth } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: '',
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus({ type: null, message: '' });

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const contentType = response.headers.get('content-type');
      let data;
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error('Non-JSON response received:', text);
        throw new Error(`Server returning non-JSON response (Status: ${response.status})`);
      }

      if (!response.ok) {
        throw new Error(data?.error || 'Login gagal');
      }

      setStatus({ 
        type: 'success', 
        message: `Selamat datang kembali, ${data.user.name}! Anda akan diarahkan ke dashboard.` 
      });

      // Delay a bit for the animation
      setTimeout(() => {
        setAuth(data.user, data.token);
        router.push('/dashboard');
      }, 1500);

    } catch (error: any) {
      setStatus({ 
        type: 'error', 
        message: error.message 
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FC] dark:bg-black p-4 font-sans selection:bg-indigo-100 selection:text-indigo-600">
      <AnimatePresence>
        {status.type && (
          <StatusModal 
            type={status.type} 
            message={status.message} 
            onClose={() => setStatus({ type: null, message: '' })} 
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[440px]"
      >
        <Card className="shadow-[0_20px_50px_-20px_rgba(0,0,0,0.1)] border-none rounded-[3rem] bg-white/70 backdrop-blur-2xl dark:bg-zinc-900/50 p-4">
          <CardHeader className="space-y-6 text-center pb-8 pt-10">
            <motion.div 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex justify-center group"
            >
              <Logo className="h-32 w-32" variant="stacked" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="space-y-2"
            >
              <CardDescription className="text-base font-bold text-zinc-400 uppercase tracking-[0.3em]">
                Securely manage your PPOB finances
              </CardDescription>
            </motion.div>
          </CardHeader>

          <CardContent className="px-6">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="email" className="text-sm font-bold text-zinc-900 dark:text-zinc-200">
                  Email Address
                </Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400 group-focus-within:text-indigo-600 transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@adifacell.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12 h-14 rounded-2xl bg-zinc-50/50 border-zinc-100 dark:bg-zinc-800/50 dark:border-zinc-800 focus:ring-4 focus:ring-indigo-500/10 transition-all text-base"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="password" className="text-sm font-bold text-zinc-900 dark:text-zinc-200">
                  Password
                </Label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400 group-focus-within:text-indigo-600 transition-colors" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 h-14 rounded-2xl bg-zinc-50/50 border-zinc-100 dark:bg-zinc-800/50 dark:border-zinc-800 focus:ring-4 focus:ring-indigo-500/10 transition-all text-base"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-14 rounded-2xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 text-white font-bold text-lg shadow-xl shadow-zinc-200 dark:shadow-none hover:translate-y-[-2px] active:translate-y-0 transition-all duration-300"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Verifying...</span>
                  </div>
                ) : (
                  'Sign In to Dashboard'
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="pb-10 pt-6 justify-center">
            <p className="text-sm text-zinc-500 font-medium">
              Don't have an account? <span className="text-indigo-600 cursor-pointer hover:underline">Contact Support</span>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
