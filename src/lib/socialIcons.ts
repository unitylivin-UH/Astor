import {
  AtSign,
  Briefcase,
  Camera,
  Code,
  Globe,
  Link2,
  Mail,
  MessageCircle,
  Music,
  Play,
  Rss,
  Send,
  Share2,
  Smartphone,
  Tv,
  type LucideIcon,
} from 'lucide-react'

export const SOCIAL_ICON_OPTIONS = [
  { value: 'globe', label: 'Website (Globe)' },
  { value: 'mail', label: 'Email (Mail)' },
  { value: 'camera', label: 'Instagram (Camera)' },
  { value: 'at-sign', label: 'X / Twitter (At sign)' },
  { value: 'play', label: 'YouTube (Play)' },
  { value: 'tv', label: 'Video / TV' },
  { value: 'music', label: 'TikTok / Music' },
  { value: 'briefcase', label: 'LinkedIn (Briefcase)' },
  { value: 'code', label: 'GitHub (Code)' },
  { value: 'message-circle', label: 'Chat (Message)' },
  { value: 'send', label: 'Telegram (Send)' },
  { value: 'smartphone', label: 'Mobile app' },
  { value: 'share-2', label: 'Share' },
  { value: 'rss', label: 'RSS' },
  { value: 'link-2', label: 'Link' },
] as const

export type SocialIconName = (typeof SOCIAL_ICON_OPTIONS)[number]['value']

const ICON_MAP: Record<SocialIconName, LucideIcon> = {
  globe: Globe,
  mail: Mail,
  camera: Camera,
  'at-sign': AtSign,
  play: Play,
  tv: Tv,
  music: Music,
  briefcase: Briefcase,
  code: Code,
  'message-circle': MessageCircle,
  send: Send,
  smartphone: Smartphone,
  'share-2': Share2,
  rss: Rss,
  'link-2': Link2,
}

export function getSocialIcon(name: string): LucideIcon {
  return ICON_MAP[name as SocialIconName] ?? Globe
}

export function isSocialIconName(name: string): name is SocialIconName {
  return name in ICON_MAP
}
