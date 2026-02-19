import { LoginForm } from '@/components/auth/LoginForm';
import { PageTransition } from '@/components/common/PageTransition';

export default function LoginPage() {
  return (
    <PageTransition>
      <LoginForm />
    </PageTransition>
  );
}
