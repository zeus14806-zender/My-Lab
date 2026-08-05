export interface ElementData {
  symbol: string;
  name: string;
  number: number;
  mass: string;
  category: 'No Metal' | 'Metales Alcalinos' | 'Metales de Transición' | 'Gases Nobles' | 'Metaloides' | 'Halógenos';
  state: string;
  meltingPoint: string;
  config: string;
  discovered: string;
  description: string;
}

export interface ReactionResult {
  equation: string;
  name: string;
  type: string;
  visuals: string;
  funFact: string;
  animationType: 'bubbling' | 'colorChange' | 'explosion' | 'precipitation' | 'heat' | 'glowing' | 'neutral';
  glowColor: string;
  warning: string;
}

export interface ActivityItem {
  id: string;
  student: string;
  initials: string;
  action: string;
  time: string;
  bgAvatarClass: string;
  avatarTextColor: string;
}

export interface LabReport {
  id: string;
  title: string;
  sender: string;
  priority: 'Alta' | 'Media' | 'Baja';
  content: string;
}

export interface CourseModule {
  id: string;
  title: string;
  year: string;
  subject: string;
  status: 'Iniciado' | 'Listo' | 'En Progreso';
  color: string;
  bgColor: string;
  imageUrl: string;
}
