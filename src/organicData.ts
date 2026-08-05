import { Chain, Branch, Exercise } from './organicTypes';

// ============================================
// FUNCIONES PARA GENERAR CADENAS
// ============================================

export function generarCadenaAlcano(cantidadCarbonos: number): Chain {
  const carbons = [];
  for (let i = 0; i < cantidadCarbonos; i++) {
    let type: 'primario' | 'secundario' | 'terciario' | 'cuaternario' = 'primario';
    if (i === 0 || i === cantidadCarbonos - 1) {
      type = 'primario';
    } else if (cantidadCarbonos === 3 && i === 1) {
      type = 'secundario';
    } else if (i === 1 || i === cantidadCarbonos - 2) {
      type = 'secundario';
    } else {
      type = 'secundario';
    }
    
    carbons.push({
      id: `c${i}`,
      type: type,
      position: i + 1,
      connections: [],
      hydrogens: type === 'primario' ? 3 : type === 'secundario' ? 2 : type === 'terciario' ? 1 : 0,
      x: 50 + i * 80,
      y: 200
    });
  }
  
  // Conectar carbonos
  for (let i = 0; i < carbons.length - 1; i++) {
    carbons[i].connections.push(carbons[i + 1].id);
    carbons[i + 1].connections.push(carbons[i].id);
  }
  
  const names = ['Metano', 'Etano', 'Propano', 'Butano', 'Pentano', 'Hexano', 'Heptano', 'Octano', 'Nonano', 'Decano'];
  const formulas = ['CH₄', 'C₂H₆', 'C₃H₈', 'C₄H₁₀', 'C₅H₁₂', 'C₆H₁₄', 'C₇H₁₆', 'C₈H₁₈', 'C₉H₂₀', 'C₁₀H₂₂'];
  
  return {
    id: `chain-${Date.now()}`,
    carbons: carbons,
    type: 'alcano',
    name: names[cantidadCarbonos - 1] || `${cantidadCarbonos} carbonos`,
    formula: formulas[cantidadCarbonos - 1] || `C${cantidadCarbonos}H${cantidadCarbonos * 2 + 2}`,
    branches: [],
    doubleBonds: [],
    tripleBonds: [],
    isCyclic: false
  };
}

export function generarCadenaAlqueno(cantidadCarbonos: number, posicionDoble: number): Chain {
  const chain = generarCadenaAlcano(cantidadCarbonos);
  chain.type = 'alqueno';
  chain.doubleBonds = [posicionDoble];
  
  // Ajustar hidrógenos
  chain.carbons.forEach((c, index) => {
    if (index === posicionDoble - 1 || index === posicionDoble) {
      c.hydrogens = c.type === 'primario' ? 2 : 1;
    }
  });
  
  const names = ['Eteno', 'Propeno', 'Buteno', 'Penteno', 'Hexeno', 'Hepteno', 'Octeno'];
  const posStr = posicionDoble === 1 ? '' : `${posicionDoble}-`;
  chain.name = `${posStr}${names[cantidadCarbonos - 2] || `${cantidadCarbonos}-eno`}`;
  chain.formula = `C${cantidadCarbonos}H${cantidadCarbonos * 2}`;
  
  return chain;
}

export function generarCadenaAlquino(cantidadCarbonos: number, posicionTriple: number): Chain {
  const chain = generarCadenaAlcano(cantidadCarbonos);
  chain.type = 'alquino';
  chain.tripleBonds = [posicionTriple];
  
  chain.carbons.forEach((c, index) => {
    if (index === posicionTriple - 1 || index === posicionTriple) {
      c.hydrogens = c.type === 'primario' ? 1 : 0;
    }
  });
  
  const names = ['Etino', 'Propino', 'Butino', 'Pentino', 'Hexino', 'Heptino', 'Octino'];
  const posStr = posicionTriple === 1 ? '' : `${posicionTriple}-`;
  chain.name = `${posStr}${names[cantidadCarbonos - 2] || `${cantidadCarbonos}-ino`}`;
  chain.formula = `C${cantidadCarbonos}H${cantidadCarbonos * 2 - 2}`;
  
  return chain;
}

export function generarCadenaRamificada(carbonosBase: number, ramificaciones: { posicion: number, carbonos: number }[]): Chain {
  const chain = generarCadenaAlcano(carbonosBase);
  
  ramificaciones.forEach(ram => {
    chain.branches.push({
      position: ram.posicion,
      carbonCount: ram.carbonos,
      name: ram.carbonos === 1 ? 'metil' : ram.carbonos === 2 ? 'etil' : 'propil',
      type: ram.carbonos === 1 ? 'metil' : ram.carbonos === 2 ? 'etil' : 'propil'
    });
  });
  
  // Construir nombre
  let name = '';
  const branchNames: { [key: number]: string } = {
    1: 'metil',
    2: 'etil',
    3: 'propil',
    4: 'butil'
  };
  
  const prefixCount: { [key: string]: number } = {};
  chain.branches.forEach(b => {
    const key = branchNames[b.carbonCount] || 'metil';
    prefixCount[key] = (prefixCount[key] || 0) + 1;
  });
  
  const prefixes: { [key: string]: string } = {
    'metil': 'metil',
    'etil': 'etil',
    'propil': 'propil',
    'butil': 'butil'
  };
  
  const numPrefix: { [key: number]: string } = {
    1: '',
    2: 'di',
    3: 'tri',
    4: 'tetra'
  };
  
  const orderedBranches = chain.branches.sort((a, b) => a.position - b.position);
  const branchStr = orderedBranches.map(b => {
    const count = chain.branches.filter(br => br.carbonCount === b.carbonCount && br.position === b.position).length;
    const prefix = count > 1 ? numPrefix[count] : '';
    const name = prefixes[branchNames[b.carbonCount] || 'metil'];
    return `${b.position}-${prefix}${name}`;
  }).join(',');
  
  const baseNames = ['met', 'et', 'prop', 'but', 'pent', 'hex', 'hept', 'oct', 'non', 'dec'];
  const baseName = baseNames[carbonosBase - 1] || `${carbonosBase}`;
  
  name = `${branchStr}${branchStr ? '-' : ''}${baseName}ano`;
  chain.name = name;
  
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