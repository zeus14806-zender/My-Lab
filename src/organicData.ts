import { Chain, Branch, CarbonAtom, Exercise } from './organicTypes';

// ============================================
// UTILIDADES INTERNAS
// ============================================

let chainIdCounter = 0;
function nextChainId(): string {
  chainIdCounter += 1;
  return `chain-${Date.now()}-${chainIdCounter}`;
}

const SUBSCRIPT_DIGITS: Record<string, string> = {
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
  '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉'
};

function toSubscript(value: number): string {
  return String(value).split('').map(d => SUBSCRIPT_DIGITS[d] ?? d).join('');
}

function hydrogensFromConnections(connections: number): number {
  return Math.max(0, 4 - connections);
}

function typeFromConnections(connections: number): CarbonAtom['type'] {
  if (connections <= 1) return 'primario';
  if (connections === 2) return 'secundario';
  if (connections === 3) return 'terciario';
  return 'cuaternario';
}

function substituentName(carbonCount: number): Branch['type'] {
  if (carbonCount <= 1) return 'metil';
  if (carbonCount === 2) return 'etil';
  if (carbonCount === 3) return 'propil';
  return 'butil';
}

function buildBranchedName(branches: Branch[], baseCarbonos: number): string {
  const groups = new Map<number, number[]>();
  branches.forEach(b => {
    if (!groups.has(b.carbonCount)) groups.set(b.carbonCount, []);
    groups.get(b.carbonCount)!.push(b.position);
  });

  const multiplicadores = ['', '', 'di', 'tri', 'tetra', 'penta'];
  const ordered = [...groups.keys()].sort((a, b) =>
    substituentName(a).localeCompare(substituentName(b))
  );

  const parts = ordered.map(cc => {
    const positions = groups.get(cc)!.slice().sort((a, b) => a - b);
    const mult = multiplicadores[positions.length] ?? '';
    return `${positions.join(',')}-${mult}${substituentName(cc)}`;
  });

  const baseNames = ['met', 'et', 'prop', 'but', 'pent', 'hex', 'hept', 'oct', 'non', 'dec'];
  const baseName = baseNames[baseCarbonos - 1] || `${baseCarbonos}`;
  return `${parts.join('-')}${baseName}ano`;
}

// ============================================
// FUNCIONES PARA GENERAR CADENAS
// ============================================

export function generarCadenaAlcano(cantidadCarbonos: number): Chain {
  const carbons: CarbonAtom[] = [];
  for (let i = 0; i < cantidadCarbonos; i++) {
    const connections = cantidadCarbonos === 1
      ? 0
      : (i === 0 || i === cantidadCarbonos - 1 ? 1 : 2);

    carbons.push({
      id: `c${i}`,
      type: typeFromConnections(connections),
      position: i + 1,
      connections: [],
      hydrogens: hydrogensFromConnections(connections),
      x: 60 + i * 80,
      y: 120
    });
  }

  // Conectar carbonos
  for (let i = 0; i < carbons.length - 1; i++) {
    carbons[i].connections.push(carbons[i + 1].id);
    carbons[i + 1].connections.push(carbons[i].id);
  }

  const names = ['Metano', 'Etano', 'Propano', 'Butano', 'Pentano', 'Hexano', 'Heptano', 'Octano', 'Nonano', 'Decano'];

  return {
    id: nextChainId(),
    carbons: carbons,
    type: 'alcano',
    name: names[cantidadCarbonos - 1] || `${cantidadCarbonos} carbonos`,
    formula: `C${toSubscript(cantidadCarbonos)}H${toSubscript(cantidadCarbonos * 2 + 2)}`,
    branches: [],
    doubleBonds: [],
    tripleBonds: [],
    isCyclic: false
  };
}

export function generarCadenaAlqueno(cantidadCarbonos: number, posicionDoble: number): Chain {
  const chain = generarCadenaAlcano(cantidadCarbonos);
  chain.id = nextChainId();
  chain.type = 'alqueno';

  const maxPos = Math.max(1, cantidadCarbonos - 1);
  const pos = Math.min(Math.max(1, posicionDoble), maxPos);
  chain.doubleBonds = [pos];

  // Ajustar hidrógenos: cada carbono del doble enlace pierde un H
  chain.carbons.forEach((c, index) => {
    if (index === pos - 1 || index === pos) {
      c.hydrogens = Math.max(0, c.hydrogens - 1);
    }
  });

  const names = ['Eteno', 'Propeno', 'Buteno', 'Penteno', 'Hexeno', 'Hepteno', 'Octeno', 'Noneno', 'Deceno'];
  const baseName = names[cantidadCarbonos - 2] || `${cantidadCarbonos}-eno`;
  const locant = Math.min(pos, cantidadCarbonos - pos);
  chain.name = cantidadCarbonos <= 3 ? baseName : `${locant}-${baseName}`;
  chain.formula = `C${toSubscript(cantidadCarbonos)}H${toSubscript(cantidadCarbonos * 2)}`;

  return chain;
}

export function generarCadenaAlquino(cantidadCarbonos: number, posicionTriple: number): Chain {
  const chain = generarCadenaAlcano(cantidadCarbonos);
  chain.id = nextChainId();
  chain.type = 'alquino';

  const maxPos = Math.max(1, cantidadCarbonos - 1);
  const pos = Math.min(Math.max(1, posicionTriple), maxPos);
  chain.tripleBonds = [pos];

  // Ajustar hidrógenos: cada carbono del triple enlace pierde dos H
  chain.carbons.forEach((c, index) => {
    if (index === pos - 1 || index === pos) {
      c.hydrogens = Math.max(0, c.hydrogens - 2);
    }
  });

  const names = ['Etino', 'Propino', 'Butino', 'Pentino', 'Hexino', 'Heptino', 'Octino', 'Nonino', 'Decino'];
  const baseName = names[cantidadCarbonos - 2] || `${cantidadCarbonos}-ino`;
  const locant = Math.min(pos, cantidadCarbonos - pos);
  chain.name = cantidadCarbonos <= 3 ? baseName : `${locant}-${baseName}`;
  chain.formula = `C${toSubscript(cantidadCarbonos)}H${toSubscript(cantidadCarbonos * 2 - 2)}`;

  return chain;
}

export function generarCadenaRamificada(
  carbonosBase: number,
  ramificaciones: { posicion: number; carbonos: number }[]
): Chain {
  const chain = generarCadenaAlcano(carbonosBase);
  chain.id = nextChainId();

  const branches: Branch[] = [];
  const branchCountByIndex = new Array(carbonosBase).fill(0);

  ramificaciones.forEach(ram => {
    if (carbonosBase < 3) return;
    const pos = Math.min(Math.max(2, ram.posicion), carbonosBase - 1);
    const cc = Math.min(Math.max(1, ram.carbonos), 4);
    branches.push({
      position: pos,
      carbonCount: cc,
      name: substituentName(cc),
      type: substituentName(cc)
    });
    branchCountByIndex[pos - 1] += 1;
  });

  chain.branches = branches;

  // Recalcular tipo e hidrógenos de los carbonos de la cadena principal
  chain.carbons.forEach((c, index) => {
    const baseConn = carbonosBase === 1
      ? 0
      : (index === 0 || index === carbonosBase - 1 ? 1 : 2);
    const connections = baseConn + branchCountByIndex[index];
    c.type = typeFromConnections(connections);
    c.hydrogens = hydrogensFromConnections(connections);
  });

  const baseNames = ['Metano', 'Etano', 'Propano', 'Butano', 'Pentano', 'Hexano', 'Heptano', 'Octano', 'Nonano', 'Decano'];
  chain.name = branches.length > 0
    ? buildBranchedName(branches, carbonosBase)
    : (baseNames[carbonosBase - 1] || `${carbonosBase} carbonos`);

  const totalCarbonos = carbonosBase + branches.reduce((sum, b) => sum + b.carbonCount, 0);
  chain.formula = `C${toSubscript(totalCarbonos)}H${toSubscript(totalCarbonos * 2 + 2)}`;

  return chain;
}

// ============================================
// EJERCICIOS PREDEFINIDOS
// ============================================

export const EJERCICIOS: Exercise[] = [
  {
    id: 'ex1',
    chain: generarCadenaAlcano(4),
    correctName: 'Butano',
    difficulty: 'facil',
    hint: 'Cadena lineal de 4 carbonos'
  },
  {
    id: 'ex2',
    chain: generarCadenaAlcano(6),
    correctName: 'Hexano',
    difficulty: 'facil',
    hint: 'Cadena lineal de 6 carbonos'
  },
  {
    id: 'ex3',
    chain: generarCadenaAlqueno(4, 2),
    correctName: '2-Buteno',
    difficulty: 'medio',
    hint: 'Alqueno con doble enlace en posición 2'
  },
  {
    id: 'ex4',
    chain: generarCadenaAlquino(5, 2),
    correctName: '2-Pentino',
    difficulty: 'medio',
    hint: 'Alquino con triple enlace en posición 2'
  },
  {
    id: 'ex5',
    chain: generarCadenaRamificada(5, [{ posicion: 2, carbonos: 1 }]),
    correctName: '2-metilpentano',
    difficulty: 'medio',
    hint: 'Pentano con ramificación en posición 2'
  },
  {
    id: 'ex6',
    chain: generarCadenaRamificada(6, [{ posicion: 3, carbonos: 1 }]),
    correctName: '3-metilhexano',
    difficulty: 'medio',
    hint: 'Hexano con ramificación en posición 3'
  },
  {
    id: 'ex7',
    chain: generarCadenaRamificada(6, [{ posicion: 2, carbonos: 2 }]),
    correctName: '2-etilhexano',
    difficulty: 'dificil',
    hint: 'Hexano con etil en posición 2'
  },
  {
    id: 'ex8',
    chain: generarCadenaRamificada(7, [{ posicion: 3, carbonos: 1 }, { posicion: 4, carbonos: 1 }]),
    correctName: '3,4-dimetilheptano',
    difficulty: 'dificil',
    hint: 'Heptano con dos metilos en posiciones 3 y 4'
  }
];

// ============================================
// UTILIDADES
// ============================================

export function obtenerNombreCadena(chain: Chain): string {
  return chain.name;
}

export function obtenerFormulaCadena(chain: Chain): string {
  return chain.formula;
}

export function obtenerTipoCadena(chain: Chain): string {
  const tipos = {
    'alcano': 'Alcano',
    'alqueno': 'Alqueno',
    'alquino': 'Alquino',
    'cicloalcano': 'Cicloalcano',
    'aromático': 'Aromático'
  };
  return tipos[chain.type] || 'Desconocido';
}

export function obtenerCarbonosPrimarios(chain: Chain): number {
  return chain.carbons.filter(c => c.type === 'primario').length;
}

export function obtenerCarbonosSecundarios(chain: Chain): number {
  return chain.carbons.filter(c => c.type === 'secundario').length;
}

export function obtenerCarbonosTerciarios(chain: Chain): number {
  return chain.carbons.filter(c => c.type === 'terciario').length;
}

export function obtenerCarbonosCuaternarios(chain: Chain): number {
  return chain.carbons.filter(c => c.type === 'cuaternario').length;
}

export const PREFIJOS = ['met', 'et', 'prop', 'but', 'pent', 'hex', 'hept', 'oct', 'non', 'dec'];
export const SUFIJOS = {
  'alcano': 'ano',
  'alqueno': 'eno',
  'alquino': 'ino',
  'cicloalcano': 'ano'
};

export const TIPOS_CARBONO = {
  'primario': 'Carbono Primario (unido a 1 carbono)',
  'secundario': 'Carbono Secundario (unido a 2 carbonos)',
  'terciario': 'Carbono Terciario (unido a 3 carbonos)',
  'cuaternario': 'Carbono Cuaternario (unido a 4 carbonos)'
};

export const GRUPOS_FUNCIONALES = {
  'alcano': 'Enlace simple C-C',
  'alqueno': 'Enlace doble C=C',
  'alquino': 'Enlace triple C≡C',
  'cicloalcano': 'Anillo de carbonos',
  'aromático': 'Anillo bencénico'
};