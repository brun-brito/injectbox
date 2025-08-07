import { NextApiRequest, NextApiResponse } from 'next';
import { auth } from '@/lib/firebaseAdmin';
import { signInWithEmailAndPassword, getAuth } from 'firebase/auth';
import { initializeApp, getApps } from 'firebase/app';

// Initialize Firebase client app for server-side verification
let clientAuth: ReturnType<typeof getAuth> | null = null;

const getClientAuth = () => {
  if (!clientAuth) {
    const firebaseConfig = {
      apiKey: process.env.API_KEY,
      authDomain: process.env.AUTH_DOMAIN,
      projectId: process.env.PROJECT_ID,
    };

    const app = !getApps().find(app => app.name === 'server-auth') 
      ? initializeApp(firebaseConfig, 'server-auth')
      : getApps().find(app => app.name === 'server-auth')!;

    clientAuth = getAuth(app);
  }
  return clientAuth;
};

interface LoginRequestBody {
  email: string;
  password: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body as LoginRequestBody;

  if (!email || !password) {
    return res.status(400).json({ 
      success: false, 
      error: 'Email e senha são obrigatórios' 
    });
  }

  try {
    // Usar Firebase Auth client para verificar email e senha
    const clientAuthInstance = getClientAuth();
    const userCredential = await signInWithEmailAndPassword(clientAuthInstance, email, password);
    
    // Criar custom token usando Admin SDK
    const customToken = await auth.createCustomToken(userCredential.user.uid);
    
    // Fazer logout do auth temporário do servidor
    await clientAuthInstance.signOut();
    
    return res.status(200).json({ 
      success: true, 
      customToken,
      uid: userCredential.user.uid,
      email: userCredential.user.email
    });
    
  } catch (error: unknown) {
    console.error('Erro no login:', error);
    
    let errorMessage = 'Erro ao fazer login';
    
    if (error && typeof error === 'object' && 'code' in error) {
      switch ((error as { code: string }).code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          errorMessage = 'Email ou senha inválidos';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Muitas tentativas. Tente novamente mais tarde';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Email inválido';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Conta desabilitada';
          break;
        default:
          errorMessage = 'Erro interno do servidor';
      }
    }
    
    return res.status(401).json({ 
      success: false, 
      error: errorMessage 
    });
  }
}
