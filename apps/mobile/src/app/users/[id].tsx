import { UserProfileView } from '@/components/UserProfileView';
import { useLocalSearchParams } from 'expo-router';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <UserProfileView userId={id} />;
}
