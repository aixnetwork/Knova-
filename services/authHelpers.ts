import type { AuthUser } from './api';
import type { UserProfile } from '../types';
import { UserRole, SubscriptionTier } from '../types';

export function mapAuthUserToProfile(be: AuthUser): UserProfile {
  const role =
    be.role === 'SUPERADMIN' || be.role === 'ADMIN'
      ? UserRole.ADMIN
      : be.role === 'FACILITATOR'
        ? UserRole.FACILITATOR
        : UserRole.LEARNER;
  const tier =
    be.role === 'SUPERADMIN' || be.role === 'ADMIN'
      ? SubscriptionTier.COMPANY
      : be.role === 'FACILITATOR'
        ? SubscriptionTier.EXPERT
        : SubscriptionTier.FREE;
  return {
    id: be.id,
    name: be.name,
    email: be.email,
    role,
    tier,
    avatarUrl: be.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(be.email)}`,
    isCreatorMode: role === UserRole.ADMIN || role === UserRole.FACILITATOR,
    title: be.title ?? (role === UserRole.ADMIN ? 'Administrator' : role === UserRole.FACILITATOR ? 'Expert' : undefined),
    industry: be.industry,
    bio: be.bio,
    hasGeminiKey: be.hasGeminiKey === true,
  };
}
