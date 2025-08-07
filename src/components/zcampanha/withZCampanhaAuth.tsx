import { useRouter } from 'next/router';
import { ZCampanhaProtectedRoute } from './ZCampanhaProtectedRoute';

export function withZCampanhaAuth<T extends object>(Component: React.ComponentType<T>) {
  const WrappedComponent = (props: T) => {
    const router = useRouter();
    const { cliente } = router.query as { cliente: string };

    return (
      <ZCampanhaProtectedRoute cliente={cliente}>
        <Component {...props} />
      </ZCampanhaProtectedRoute>
    );
  };

  WrappedComponent.displayName = `withZCampanhaAuth(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}
