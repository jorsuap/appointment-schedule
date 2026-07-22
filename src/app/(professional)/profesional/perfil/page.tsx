import { ProfileForm } from '@/components/professional/profile-form';
import { ProfilePreview } from '@/components/professional/profile-preview';

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-grape">Mi Perfil</h1>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ProfileForm />
        </div>
        <div>
          <ProfilePreview />
        </div>
      </div>
    </div>
  );
}
