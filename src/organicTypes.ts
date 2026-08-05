export interface CarbonAtom {
  id: string;
  type: 'primario' | 'secundario' | 'terciario' | 'cuaternario';
  position: number;
  connections: string[];
  hydrogens: number;
  label?: string;
  x: number;
  y: number;
}

export interface Chain {
  id: string;
  carbons: CarbonAtom[];
  type: 'alcano' | 'alqueno' | 'alquino' | 'cicloalcano' | 'aromático';
  name: string;
  formula: string;
  branches: Branch[];
  doubleBonds: number[];
  tripleBonds: number[];
  isCyclic: boolean;
}

export interface Branch {
  position: number;
  carbonCount: number;
  name: string;
  type: 'metil' | 'etil' | 'propil' | 'butil' | 'isopropil' | 'secbutil' | 'terbutil';
}

export interface Exercise {
  id: string;
  chain: Chain;
  correctName: string;
  userAnswer?: string;
  isCorrect?: boolean;
  difficulty: 'facil' | 'medio' | 'dificil';
  hint?: string;
}

export interface ExerciseResult {
  exerciseId: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  timeSpent: number;
}