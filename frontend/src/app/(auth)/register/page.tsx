import { RegisterForm } from '@/components/auth/RegisterForm';
import { PageTransition } from '@/components/common/PageTransition';

export default function RegisterPage() {
  return (
    <PageTransition>
      <RegisterForm />
    </PageTransition>
  );
}
