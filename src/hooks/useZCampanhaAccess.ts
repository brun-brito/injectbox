import { useEffect, useState, useRef } from 'react';
import { useAuth } from './useAuth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Cache mais simples
const accessCache = new Map<string, boolean>();
// Track ongoing requests to prevent duplicates
const ongoingRequests = new Set<string>();

export const useZCampanhaAccess = (cliente: string) => {
  const { user, loading: authLoading } = useAuth();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const checkedRef = useRef<string>('');

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let isCancelled = false;

    const checkAccess = async () => {
      if (!user?.email || !cliente || authLoading) {
        if (!user?.email && !authLoading) {
          setHasAccess(null);
          setLoading(false);
          setError(null);
        }
        return;
      }

      const cacheKey = `${cliente}:${user.email}`;
      
      // Avoid duplicate checks for the same key
      if (checkedRef.current === cacheKey) {
        return;
      }
      
      // Verificar cache primeiro (mais simples)
      if (accessCache.has(cacheKey)) {
        const cachedResult = accessCache.get(cacheKey)!;
        setHasAccess(cachedResult);
        setLoading(false);
        setError(cachedResult ? null : 'Você não possui acesso a essa página.');
        checkedRef.current = cacheKey;
        return;
      }

      // Prevent simultaneous requests
      if (ongoingRequests.has(cacheKey)) {
        return;
      }

      ongoingRequests.add(cacheKey);
      
      setLoading(true);
      setError(null);

      // Timeout de 10 segundos
      timeoutId = setTimeout(() => {
        if (!isCancelled) {
          setError('Timeout ao verificar permissões');
          setHasAccess(false);
          setLoading(false);
          accessCache.set(cacheKey, false); // Cache resultado negativo
          ongoingRequests.delete(cacheKey);
        }
      }, 10000);

      try {
        const empresaRef = doc(db, 'empresas', cliente);
        const empresaDoc = await getDoc(empresaRef);

        if (isCancelled) return;

        clearTimeout(timeoutId);

        if (!empresaDoc.exists()) {
          setError(`Empresa ${cliente} não encontrada`);
          setHasAccess(false);
          accessCache.set(cacheKey, false);
          return;
        }

        const empresaData = empresaDoc.data();
        const emailsAutorizados = empresaData?.emails || [];


        const userHasAccess = emailsAutorizados.includes(user.email);
        
        
        // Cache e set resultado
        accessCache.set(cacheKey, userHasAccess);
        setHasAccess(userHasAccess);
        setError(userHasAccess ? null : 'Você não possui acesso a essa página.');
        checkedRef.current = cacheKey;
          
      } catch (err) {
        if (!isCancelled) {
          console.error('❌ Error checking access:', err);
          clearTimeout(timeoutId);
          setError('Erro ao verificar permissões');
          setHasAccess(false);
          accessCache.set(cacheKey, false);
          checkedRef.current = cacheKey;
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
          ongoingRequests.delete(cacheKey);
        }
      }
    };

    checkAccess();

    // Cleanup
    return () => {
      isCancelled = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [user?.email, cliente, authLoading]);

  // Reset quando cliente muda
  useEffect(() => {
    setLoading(true);
    setHasAccess(null);
    setError(null);
    checkedRef.current = '';
  }, [cliente]);

  return {
    user,
    hasAccess,
    loading: authLoading || loading,
    error,
    isAuthenticated: !!user
  };
};
