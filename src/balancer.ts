import { ALL_118_ELEMENTS } from './all118Elements';

// Map of standard element masses for quick lookup
const ELEMENT_MASS_MAP: Record<string, number> = {};
ALL_118_ELEMENTS.forEach(el => {
  ELEMENT_MASS_MAP[el.symbol] = el.mass;
});

/**
 * Parses a chemical formula (e.g., "H2O", "Fe2O3", "Ca(OH)2") into its elemental composition map.
 */
export function parseFormula(formula: string): Record<string, number> {
  const result: Record<string, number> = {};
  
  // Clean the formula from spaces
  let str = formula.replace(/\s+/g, '');
  
  // Parse parentheses first, e.g., Ca(OH)2 -> Ca + (OH)*2
  while (str.includes('(')) {
    const match = str.match(/\(([^())]+)\)([0-9]*)/);
    if (!match) break;
    const fullMatch = match[0];
    const inner = match[1];
    const multiplier = match[2] ? parseInt(match[2], 10) : 1;
    
    const innerParsed = parseSimpleFormula(inner);
    let expanded = '';
    for (const [sym, count] of Object.entries(innerParsed)) {
      expanded += sym + (count * multiplier);
    }
    str = str.replace(fullMatch, expanded);
  }
  
  return parseSimpleFormula(str);
}

function parseSimpleFormula(formula: string): Record<string, number> {
  const result: Record<string, number> = {};
  const regex = /([A-Z][a-z]?)([0-9]*)/g;
  let match;
  
  while ((match = regex.exec(formula)) !== null) {
    const symbol = match[1];
    const countStr = match[2];
    const count = countStr ? parseInt(countStr, 10) : 1;
    
    if (ELEMENT_MASS_MAP[symbol] !== undefined) {
      result[symbol] = (result[symbol] || 0) + count;
    } else {
      result[symbol] = (result[symbol] || 0) + count;
    }
  }
  
  return result;
}

/**
 * Computes molar mass of a single compound
 */
export function getMolarMass(formula: string): number {
  const composition = parseFormula(formula);
  let totalMass = 0;
  for (const [symbol, count] of Object.entries(composition)) {
    const mass = ELEMENT_MASS_MAP[symbol] || 0;
    totalMass += mass * count;
  }
  return totalMass;
}

export interface BalancedEquationResult {
  success: boolean;
  balancedString: string;
  reactants: { formula: string; coefficient: number; molarMass: number }[];
  products: { formula: string; coefficient: number; molarMass: number }[];
  totalReactantsMass: number;
  totalProductsMass: number;
  massDifference: number;
  error?: string;
}

/**
 * Balances a skeletal equation (e.g. "H2 + O2 = H2O" or "Fe + O2 -> Fe2O3")
 */
export function balanceEquation(skeletal: string): BalancedEquationResult {
  try {
    const sides = skeletal.split(/[➔=➔→\-]+/);
    if (sides.length !== 2) {
      return { success: false, error: "La ecuación debe contener un separador como '=' o '->'", balancedString: "", reactants: [], products: [], totalReactantsMass: 0, totalProductsMass: 0, massDifference: 0 };
    }
    
    const reactantStrings = sides[0].split('+').map(s => s.trim()).filter(Boolean);
    const productStrings = sides[1].split('+').map(s => s.trim()).filter(Boolean);
    
    if (reactantStrings.length === 0 || productStrings.length === 0) {
      return { success: false, error: "Debe haber al menos un reactivo y un producto", balancedString: "", reactants: [], products: [], totalReactantsMass: 0, totalProductsMass: 0, massDifference: 0 };
    }
    
    const rCompositions = reactantStrings.map(f => parseFormula(f));
    const pCompositions = productStrings.map(f => parseFormula(f));
    
    const allElementsSet = new Set<string>();
    rCompositions.forEach(comp => Object.keys(comp).forEach(el => allElementsSet.add(el)));
    pCompositions.forEach(comp => Object.keys(comp).forEach(el => allElementsSet.add(el)));
    const elements = Array.from(allElementsSet);
    
    if (elements.length === 0) {
      return { success: false, error: "No se identificaron elementos elementales válidos en la ecuación", balancedString: "", reactants: [], products: [], totalReactantsMass: 0, totalProductsMass: 0, massDifference: 0 };
    }
    
    const numR = reactantStrings.length;
    const numP = productStrings.length;
    const totalSpecies = numR + numP;
    
    if (totalSpecies > 7) {
      return { success: false, error: "Demasiados reactivos/productos implicados para balance dinámico automático", balancedString: "", reactants: [], products: [], totalReactantsMass: 0, totalProductsMass: 0, massDifference: 0 };
    }
    
    const coefficients = new Array<number>(totalSpecies).fill(1);
    let solved = false;
    
    const checkBalance = (coeffs: number[]) => {
      for (const el of elements) {
        let rSum = 0;
        for (let i = 0; i < numR; i++) {
          rSum += (rCompositions[i][el] || 0) * coeffs[i];
        }
        
        let pSum = 0;
        for (let i = 0; i < numP; i++) {
          pSum += (pCompositions[i][el] || 0) * coeffs[numR + i];
        }
        
        if (rSum !== pSum) return false;
      }
      return true;
    };
    
    const limit = 12;
    const findCoefficients = (idx: number): boolean => {
      if (idx === totalSpecies) {
        return checkBalance(coefficients);
      }
      
      for (let c = 1; c <= limit; c++) {
        coefficients[idx] = c;
        if (findCoefficients(idx + 1)) return true;
      }
      return false;
    };
    
    solved = findCoefficients(0);
    
    if (!solved) {
      return {
        success: false,
        error: "No se pudo hallar coeficientes enteros simples (< 12) para balancear. Verifica las fórmulas.",
        balancedString: skeletal,
        reactants: reactantStrings.map(f => ({ formula: f, coefficient: 1, molarMass: getMolarMass(f) })),
        products: productStrings.map(f => ({ formula: f, coefficient: 1, molarMass: getMolarMass(f) })),
        totalReactantsMass: reactantStrings.reduce((acc, f) => acc + getMolarMass(f), 0),
        totalProductsMass: productStrings.reduce((acc, f) => acc + getMolarMass(f), 0),
        massDifference: Math.abs(reactantStrings.reduce((acc, f) => acc + getMolarMass(f), 0) - productStrings.reduce((acc, f) => acc + getMolarMass(f), 0))
      };
    }
    
    const reactantsData = reactantStrings.map((formula, idx) => ({
      formula,
      coefficient: coefficients[idx],
      molarMass: getMolarMass(formula)
    }));
    
    const productsData = productStrings.map((formula, idx) => ({
      formula,
      coefficient: coefficients[numR + idx],
      molarMass: getMolarMass(formula)
    }));
    
    const totalReactantsMass = reactantsData.reduce((acc, r) => acc + (r.coefficient * r.molarMass), 0);
    const totalProductsMass = productsData.reduce((acc, p) => acc + (p.coefficient * p.molarMass), 0);
    
    const rString = reactantsData.map(r => `${r.coefficient > 1 ? r.coefficient + " " : ""}${r.formula}`).join(" + ");
    const pString = productsData.map(p => `${p.coefficient > 1 ? p.coefficient + " " : ""}${p.formula}`).join(" + ");
    const balancedString = `${rString}  ➔  ${pString}`;
    
    return {
      success: true,
      balancedString,
      reactants: reactantsData,
      products: productsData,
      totalReactantsMass,
      totalProductsMass,
      massDifference: Math.abs(totalReactantsMass - totalProductsMass)
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Error al analizar la ecuación",
      balancedString: skeletal,
      reactants: [],
      products: [],
      totalReactantsMass: 0,
      totalProductsMass: 0,
      massDifference: 0
    };
  }
}