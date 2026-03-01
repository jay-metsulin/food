import { useState, useEffect } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import Input from '@/components/Input';
import Button from '@/components/Button';
import SkeletonLoader from '@/components/SkeletonLoader';
import Toast from '@/components/Toast';

export default function ProfileScreen() {
  const { user, clearAuth } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'error' | 'success' | 'info' });

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<any>('/api/profile');
        if (res.success) {
          setProfile(res.data);
          setName(res.data.name || '');
          setPhone(res.data.phone || '');
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put<any>('/api/profile', { name, phone });
      if (res.success) {
        setProfile(res.data);
        setToast({ visible: true, message: 'Profile updated!', type: 'success' });
      }
    } catch {
      setToast({ visible: true, message: 'Network error', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white p-6 pt-16 gap-4">
        <SkeletonLoader width="40%" height={28} />
        <SkeletonLoader width="100%" height={48} />
        <SkeletonLoader width="100%" height={48} />
        <SkeletonLoader width="100%" height={48} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 48 }}>
        <View className="items-center mb-8">
          <View className="w-20 h-20 rounded-full bg-red-100 items-center justify-center mb-3">
            <Text className="text-3xl">👤</Text>
          </View>
          <Text className="text-xl font-bold text-gray-900">{profile?.name}</Text>
          <Text className="text-sm text-gray-500">{profile?.email}</Text>
        </View>

        <Input label="Name" value={name} onChangeText={setName} placeholder="Your name" />
        <Input label="Phone" value={phone} onChangeText={setPhone} placeholder="+14155551234" keyboardType="phone-pad" />
        <Input label="Email" value={profile?.email || ''} editable={false} placeholder="" />
        <Input label="Date of Birth" value={profile?.dob || ''} editable={false} placeholder="" />

        {/* Addresses */}
        {profile?.addresses?.length > 0 && (
          <View className="mt-4 mb-6">
            <Text className="text-sm font-semibold text-gray-700 mb-2">Addresses</Text>
            {profile.addresses.map((addr: any) => (
              <View key={addr.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200 mb-2">
                <Text className="font-semibold text-gray-900">{addr.label}</Text>
                <Text className="text-sm text-gray-500">{`${addr.street}, ${addr.city}, ${addr.state} ${addr.zip}`}</Text>
              </View>
            ))}
          </View>
        )}

        <Button label="Save Changes" onPress={handleSave} loading={saving} />

        <View className="mt-6">
          <Button label="Log Out" variant="ghost" onPress={clearAuth} />
        </View>
      </ScrollView>

      <Toast message={toast.message} type={toast.type} visible={toast.visible}
        onDismiss={() => setToast(t => ({ ...t, visible: false }))} />
    </View>
  );
}