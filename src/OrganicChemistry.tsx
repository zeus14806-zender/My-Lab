import { useState, useEffect } from 'react';
import { 
  Beaker, 
  ChevronRight, 
  CheckCircle, 
  XCircle, 
  HelpCircle,
  RefreshCw,
  Award,
  Clock,
  Lightbulb,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { Chain, CarbonAtom, Exercise } from './organicTypes';
import { 
  EJERCICIOS, 
  generarCadenaAlcano,
  generarCadenaAlqueno,
  generarCadenaAlquino,
  generarCadenaRamificada,
  obtenerNombreCadena,
  obtenerFormulaCadena,
  obtenerTipoCadena,
  TIPOS_CARBONO
} from './organicData';

interface OrganicChemistryProps {
  onToast?: (message: string) => void;
}

export default function OrganicChemistry({ onToast }: OrganicChemistryProps) {
  const [activeTab, setActiveTab] = useState<'constructor' | 'ejercicios' | 'teoria'>('constructor');
  
  // Estado del Constructor
  const [carbonCount, setCarbonCount] = useState<number>(4);
  const [chainType, setChainType] = useState<'alcano' | 'alqueno' | 'alquino' | 'ramificado'>('alcano');
  const [currentChain, setCurrentChain] = useState<Chain>(generarCadenaAlcano(4));
  const [showFormula, setShowFormula] = useState<boolean>(false);
  
  // Estado de Ejercicios
  const [exercises, setExercises] = useState<Exercise[]>(EJERCICIOS);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState<number>(0);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [showAnswer, setShowAnswer] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [totalAttempts, setTotalAttempts] = useState<number>(0);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [exercisesCompleted, setExercisesCompleted] = useState<Set<string>>(new Set());
  
  // Estado del Constructor de Cadenas
  const [chainHistory, setChainHistory] = useState<Chain[]>([]);
  const [customName, setCustomName] = useState<string>('');

  // ============================================
  // FUNCIONES DEL CONSTRUCTOR
  // ============================================

  const generarCadena = () => {
    let chain: Chain;
    switch(chainType) {
      case 'alcano':
        chain = generarCadenaAlcano(carbonCount);
        break;
      case 'alqueno':
        const posDoble = Math.floor(Math.random() * (carbonCount - 1)) + 1;
        chain = generarCadenaAlqueno(carbonCount, posDoble);
        break;
      case 'alquino':
        const posTriple = Math.floor(Math.random() * (carbonCount - 1)) + 1;
        chain = generarCadenaAlquino(carbonCount, posTriple);
        break;
      case 'ramificado':
        const ramCount = Math.floor(Math.random() * 3) + 1;
        const ramificaciones = [];
        for (let i = 0; i < ramCount; i++) {
          const pos = Math.floor(Math.random() * (carbonCount - 2)) + 2;
          const carb = Math.floor(Math.random() * 2) + 1;
          ramificaciones.push({ posicion: pos, carbonos: carb });
        }
        chain = generarCadenaRamificada(carbonCount, ramificaciones);
        break;
      default:
        chain = generarCadenaAlcano(carbonCount);
    }
    setCurrentChain(chain);
    setChainHistory(prev => [...prev, chain]);
    setCustomName('');
    setShowFormula(false);
    if (onToast) onToast(`✅ Cadena generada: ${chain.name}`);
  };

  // ============================================
  // FUNCIONES DE EJERCICIOS
  // ============================================

  const verificarRespuesta = () => {
    setTotalAttempts(prev => prev + 1);
    const currentExercise = exercises[currentExerciseIndex];
    const isCorrect = userAnswer.toLowerCase().trim() === currentExercise.correctName.toLowerCase().trim();
    
    if (isCorrect) {
      setScore(prev => prev + 1);
      setExercisesCompleted(prev => new Set(prev).add(currentExercise.id));
      if (onToast) onToast('✅ ¡Correcto!');
    } else {
      if (onToast) onToast(`❌ Incorrecto. Respuesta correcta: ${currentExercise.correctName}`);
    }
    
    setShowAnswer(true);
  };

  const siguienteEjercicio = () => {
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
      setUserAnswer('');
      setShowAnswer(false);
      setShowHint(false);
    } else {
      if (onToast) onToast('🎉 ¡Completaste todos los ejercicios!');
      setCurrentExerciseIndex(0);
      setUserAnswer('');
      setShowAnswer(false);
      setShowHint(false);
    }
  };

  const reiniciarEjercicios = () => {
    setExercises(EJERCICIOS);
    setCurrentExerciseIndex(0);
    setUserAnswer('');
    setShowAnswer(false);
    setShowHint(false);
    setScore(0);
    setTotalAttempts(0);
    setExercisesCompleted(new Set());
    if (onToast) onToast('🔄 Ejercicios reiniciados');
  };

  // ============================================
  // RENDER: CONSTRUCTOR DE CADENAS
  // ============================================

  const renderConstructor = () => (
    <div className="space-y-6">
      {/* Controles */}
      <div className="bg-white border border-[#cbc3d5]/35 rounded-[2rem] p-6 shadow-sm">
        <h3 className="text-sm font-black text-[#181c1e] mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#461599]">construction</span>
          Constructor de Cadenas
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="text-[10px] font-bold text-[#7b7484] uppercase block mb-1">
              Número de Carbonos
            </label>
            <input
              type="number"
              min="2"
              max="10"
              value={carbonCount}
              onChange={(e) => setCarbonCount(Math.max(2, Math.min(10, parseInt(e.target.value) || 4)))}
              className="w-full px-4 py-2 rounded-xl border border-[#cbc3d5]/40 bg-[#f1f4f7] outline-none text-sm font-semibold focus:border-[#461599] focus:bg-white transition-all"
            />
          </div>
          
          <div>
            <label className="text-[10px] font-bold text-[#7b7484] uppercase block mb-1">
              Tipo de Cadena
            </label>
            <select
              value={chainType}
              onChange={(e) => setChainType(e.target.value as any)}
              className="w-full px-4 py-2 rounded-xl border border-[#cbc3d5]/40 bg-[#f1f4f7] outline-none text-sm font-semibold focus:border-[#461599] focus:bg-white transition-all cursor-pointer"
            >
              <option value="alcano">Alcano</option>
              <option value="alqueno">Alqueno</option>
              <option value="alquino">Alquino</option>
              <option value="ramificado">Ramificado</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={generarCadena}
              className="w-full py-2 bg-[#461599] hover:bg-[#5e35b1] text-white text-xs font-bold rounded-xl transition-all shadow-md"
            >
              Generar Cadena
            </button>
          </div>
          
          <div className="flex items-end gap-2">
            <button
              onClick={() => setShowFormula(!showFormula)}
              className="w-full py-2 bg-[#f1f4f7] hover:bg-[#eaddff] text-[#461599] text-xs font-bold rounded-xl transition-all"
            >
              {showFormula ? 'Ocultar Fórmula' : 'Ver Fórmula'}
            </button>
          </div>
        </div>
      </div>

      {/* Visualización de la Cadena */}
      <div className="bg-white border border-[#cbc3d5]/35 rounded-[2rem] p-6 shadow-sm min-h-[300px] relative">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h4 className="text-sm font-bold text-[#181c1e]">Cadena Generada</h4>
            <p className="text-xs text-[#7b7484]">{currentChain.carbons.length} carbonos</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-[#461599]">{currentChain.name}</p>
            {showFormula && (
              <p className="text-xs font-mono text-[#7b7484]">{currentChain.formula}</p>
            )}
          </div>
        </div>

        {/* Visualización Gráfica de la Cadena */}
        <div className="relative w-full h-64 bg-[#f8fafc] rounded-xl border border-[#cbc3d5]/20 overflow-hidden">
          <svg width="100%" height="100%" viewBox="0 0 800 250">
            {/* Dibujar enlaces */}
            {currentChain.carbons.map((c, index) => {
              if (index < currentChain.carbons.length - 1) {
                const next = currentChain.carbons[index + 1];
                const isDouble = currentChain.doubleBonds.includes(index + 1);
                const isTriple = currentChain.tripleBonds.includes(index + 1);
                
                return (
                  <g key={`bond-${index}`}>
                    <line
                      x1={c.x}
                      y1={c.y}
                      x2={next.x}
                      y2={next.y}
                      stroke={isDouble ? '#eab308' : isTriple ? '#ef4444' : '#3b82f6'}
                      strokeWidth={isDouble ? 4 : isTriple ? 4 : 3}
                      strokeDasharray={isDouble ? '8,4' : isTriple ? '4,4' : 'none'}
                    />
                    {isDouble && (
                      <line
                        x1={c.x}
                        y1={c.y - 8}
                        x2={next.x}
                        y2={next.y - 8}
                        stroke="#eab308"
                        strokeWidth={3}
                        strokeDasharray="8,4"
                      />
                    )}
                    {isTriple && (
                      <>
                        <line
                          x1={c.x}
                          y1={c.y - 8}
                          x2={next.x}
                          y2={next.y - 8}
                          stroke="#ef4444"
                          strokeWidth={3}
                          strokeDasharray="4,4"
                        />
                        <line
                          x1={c.x}
                          y1={c.y + 8}
                          x2={next.x}
                          y2={next.y + 8}
                          stroke="#ef4444"
                          strokeWidth={3}
                          strokeDasharray="4,4"
                        />
                      </>
                    )}
                  </g>
                );
              }
              return null;
            })}

            {/* Dibujar átomos de carbono */}
            {currentChain.carbons.map((c) => {
              const color = c.type === 'primario' ? '#3b82f6' : 
                           c.type === 'secundario' ? '#8b5cf6' :
                           c.type === 'terciario' ? '#f59e0b' : '#ef4444';
              const label = c.type === 'primario' ? '1°' :
                           c.type === 'secundario' ? '2°' :
                           c.type === 'terciario' ? '3°' : '4°';
              
              return (
                <g key={c.id}>
                  <circle
                    cx={c.x}
                    cy={c.y}
                    r={25}
                    fill={color}
                    opacity="0.15"
                  />
                  <circle
                    cx={c.x}
                    cy={c.y}
                    r={22}
                    fill="white"
                    stroke={color}
                    strokeWidth="2"
                  />
                  <text
                    x={c.x}
                    y={c.y - 4}
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight="bold"
                    fill="#181c1e"
                  >
                    C
                  </text>
                  <text
                    x={c.x}
                    y={c.y + 14}
                    textAnchor="middle"
                    fontSize="8"
                    fill="#7b7484"
                  >
                    {label}
                  </text>
                  <text
                    x={c.x}
                    y={c.y - 28}
                    textAnchor="middle"
                    fontSize="9"
                    fill="#7b7484"
                  >
                    {c.position}
                  </text>
                  {c.hydrogens > 0 && (
                    <text
                      x={c.x + 30}
                      y={c.y + 4}
                      fontSize="9"
                      fill="#7b7484"
                    >
                      H{c.hydrogens}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Información de la Cadena */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-xs">
          <div className="bg-[#f1f4f7] rounded-xl p-3 text-center">
            <p className="text-[#7b7484] font-bold">Tipo</p>
            <p className="text-[#181c1e] font-bold">{obtenerTipoCadena(currentChain)}</p>
          </div>
          <div className="bg-[#f1f4f7] rounded-xl p-3 text-center">
            <p className="text-[#7b7484] font-bold">Carbonos</p>
            <p className="text-[#181c1e] font-bold">{currentChain.carbons.length}</p>
          </div>
          <div className="bg-[#f1f4f7] rounded-xl p-3 text-center">
            <p className="text-[#7b7484] font-bold">Enlaces</p>
            <p className="text-[#181c1e] font-bold">
              {currentChain.doubleBonds.length > 0 ? `Doble (${currentChain.doubleBonds.join(',')})` : 
               currentChain.tripleBonds.length > 0 ? `Triple (${currentChain.tripleBonds.join(',')})` : 
               'Simples'}
            </p>
          </div>
          <div className="bg-[#f1f4f7] rounded-xl p-3 text-center">
            <p className="text-[#7b7484] font-bold">Fórmula</p>
            <p className="text-[#181c1e] font-mono font-bold">{currentChain.formula}</p>
          </div>
        </div>

        {/* Ramificaciones */}
        {currentChain.branches.length > 0 && (
          <div className="mt-4 bg-[#ffe087]/20 border border-[#fdd34d]/60 rounded-xl p-3">
            <p className="text-xs font-bold text-[#725b00]">🔗 Ramificaciones:</p>
            <div className="flex flex-wrap gap-2 mt-1">
              {currentChain.branches.map((b, i) => (
                <span key={i} className="text-xs bg-white px-2 py-1 rounded-lg border border-[#cbc3d5]/30">
                  Posición {b.position}: {b.name} ({b.carbonCount} C)
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Información Teórica */}
      <div className="bg-white border border-[#cbc3d5]/35 rounded-[2rem] p-6 shadow-sm">
        <h4 className="text-xs font-bold text-[#461599] uppercase tracking-wider mb-3">📚 Tipos de Carbonos</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(TIPOS_CARBONO).map(([key, value]) => (
            <div key={key} className="bg-[#f1f4f7] rounded-xl p-3 text-center">
              <p className={`text-sm font-black ${
                key === 'primario' ? 'text-blue-500' :
                key === 'secundario' ? 'text-purple-500' :
                key === 'terciario' ? 'text-amber-500' : 'text-red-500'
              }`}>
                {key === 'primario' ? '1°' :
                 key === 'secundario' ? '2°' :
                 key === 'terciario' ? '3°' : '4°'}
              </p>
              <p className="text-[10px] text-[#7b7484] font-medium">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ============================================
  // RENDER: EJERCICIOS
  // ============================================

  const renderEjercicios = () => {
    const currentExercise = exercises[currentExerciseIndex];
    const progress = exercisesCompleted.size / exercises.length * 100;
    
    return (
      <div className="space-y-6">
        {/* Progreso */}
        <div className="bg-white border border-[#cbc3d5]/35 rounded-[2rem] p-6 shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-black text-[#181c1e]">📝 Ejercicios de Nomenclatura</h3>
              <p className="text-xs text-[#7b7484]">Ejercicio {currentExerciseIndex + 1} de {exercises.length}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-[#7b7484] font-bold">Puntaje</p>
                <p className="text-lg font-black text-[#461599]">{score}/{exercises.length}</p>
              </div>
              <button
                onClick={reiniciarEjercicios}
                className="p-2 bg-[#f1f4f7] hover:bg-[#ffdad6] rounded-xl transition-all"
                title="Reiniciar ejercicios"
              >
                <RefreshCw size={18} className="text-[#7b7484]" />
              </button>
            </div>
          </div>
          
          <div className="w-full bg-[#cbc3d5]/30 h-2 rounded-full mt-3 overflow-hidden">
            <div 
              className="bg-[#461599] h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[10px] text-[#7b7484] mt-1">
            {exercisesCompleted.size} de {exercises.length} ejercicios completados
          </p>
        </div>

        {/* Ejercicio */}
        {currentExercise && (
          <div className="bg-white border border-[#cbc3d5]/35 rounded-[2rem] p-6 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  currentExercise.difficulty === 'facil' ? 'bg-emerald-100 text-emerald-700' :
                  currentExercise.difficulty === 'medio' ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {currentExercise.difficulty === 'facil' ? '🟢 Fácil' :
                   currentExercise.difficulty === 'medio' ? '🟡 Medio' : '🔴 Difícil'}
                </span>
              </div>
              <button
                onClick={() => setShowHint(!showHint)}
                className="text-[#7b7484] hover:text-[#461599] transition-colors"
              >
                <Lightbulb size={18} />
              </button>
            </div>

            {/* Visualización de la cadena */}
            <div className="relative w-full h-48 bg-[#f8fafc] rounded-xl border border-[#cbc3d5]/20 overflow-hidden mb-4">
              <svg width="100%" height="100%" viewBox="0 0 800 180">
                {currentExercise.chain.carbons.map((c, index) => {
                  if (index < currentExercise.chain.carbons.length - 1) {
                    const next = currentExercise.chain.carbons[index + 1];
                    const isDouble = currentExercise.chain.doubleBonds.includes(index + 1);
                    const isTriple = currentExercise.chain.tripleBonds.includes(index + 1);
                    
                    return (
                      <g key={`bond-${index}`}>
                        <line
                          x1={c.x}
                          y1={c.y}
                          x2={next.x}
                          y2={next.y}
                          stroke={isDouble ? '#eab308' : isTriple ? '#ef4444' : '#3b82f6'}
                          strokeWidth={isDouble ? 4 : isTriple ? 4 : 3}
                          strokeDasharray={isDouble ? '8,4' : isTriple ? '4,4' : 'none'}
                        />
                        {isDouble && (
                          <line
                            x1={c.x}
                            y1={c.y - 8}
                            x2={next.x}
                            y2={next.y - 8}
                            stroke="#eab308"
                            strokeWidth={3}
                            strokeDasharray="8,4"
                          />
                        )}
                        {isTriple && (
                          <>
                            <line
                              x1={c.x}
                              y1={c.y - 8}
                              x2={next.x}
                              y2={next.y - 8}
                              stroke="#ef4444"
                              strokeWidth={3}
                              strokeDasharray="4,4"
                            />
                            <line
                              x1={c.x}
                              y1={c.y + 8}
                              x2={next.x}
                              y2={next.y + 8}
                              stroke="#ef4444"
                              strokeWidth={3}
                              strokeDasharray="4,4"
                            />
                          </>
                        )}
                      </g>
                    );
                  }
                  return null;
                })}

                {currentExercise.chain.carbons.map((c) => (
                  <g key={c.id}>
                    <circle
                      cx={c.x}
                      cy={c.y}
                      r={20}
                      fill="white"
                      stroke="#461599"
                      strokeWidth="2"
                    />
                    <text
                      x={c.x}
                      y={c.y + 4}
                      textAnchor="middle"
                      fontSize="12"
                      fontWeight="bold"
                      fill="#181c1e"
                    >
                      C
                    </text>
                    <text
                      x={c.x}
                      y={c.y - 24}
                      textAnchor="middle"
                      fontSize="9"
                      fill="#7b7484"
                    >
                      {c.position}
                    </text>
                  </g>
                ))}
              </svg>
            </div>

            {/* Información de la cadena */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-[#f1f4f7] rounded-xl p-2 text-center">
                <p className="text-[9px] text-[#7b7484] font-bold">Carbonos</p>
                <p className="text-sm font-black text-[#181c1e]">{currentExercise.chain.carbons.length}</p>
              </div>
              <div className="bg-[#f1f4f7] rounded-xl p-2 text-center">
                <p className="text-[9px] text-[#7b7484] font-bold">Tipo</p>
                <p className="text-sm font-black text-[#181c1e]">{obtenerTipoCadena(currentExercise.chain)}</p>
              </div>
              <div className="bg-[#f1f4f7] rounded-xl p-2 text-center">
                <p className="text-[9px] text-[#7b7484] font-bold">Enlaces</p>
                <p className="text-sm font-black text-[#181c1e]">
                  {currentExercise.chain.doubleBonds.length > 0 ? 'Dobles' :
                   currentExercise.chain.tripleBonds.length > 0 ? 'Triples' : 'Simples'}
                </p>
              </div>
            </div>

            {/* Input de respuesta */}
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Escribe el nombre de la cadena..."
                disabled={showAnswer}
                className="flex-1 px-4 py-3 rounded-xl border border-[#cbc3d5]/40 bg-[#f1f4f7] outline-none text-sm font-semibold focus:border-[#461599] focus:bg-white transition-all disabled:opacity-50"
              />
              <button
                onClick={verificarRespuesta}
                disabled={showAnswer || !userAnswer.trim()}
                className="px-6 py-3 bg-[#461599] hover:bg-[#5e35b1] text-white text-xs font-bold rounded-xl transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Verificar
              </button>
            </div>

            {/* Hint */}
            {showHint && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
                💡 {currentExercise.hint}
              </div>
            )}

            {/* Resultado */}
            {showAnswer && (
              <div className="mt-4 p-4 rounded-xl border flex items-center gap-3">
                {userAnswer.toLowerCase().trim() === currentExercise.correctName.toLowerCase().trim() ? (
                  <>
                    <CheckCircle size={20} className="text-emerald-500" />
                    <div>
                      <p className="text-sm font-bold text-emerald-700">¡Correcto!</p>
                      <p className="text-xs text-[#7b7484]">Respuesta: {currentExercise.correctName}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <XCircle size={20} className="text-red-500" />
                    <div>
                      <p className="text-sm font-bold text-red-700">Incorrecto</p>
                      <p className="text-xs text-[#7b7484]">Respuesta correcta: {currentExercise.correctName}</p>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Botón siguiente */}
            {showAnswer && (
              <button
                onClick={siguienteEjercicio}
                className="mt-4 w-full py-3 bg-[#f1f4f7] hover:bg-[#eaddff] text-[#461599] text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {currentExerciseIndex < exercises.length - 1 ? 'Siguiente Ejercicio' : 'Ver Resultados'}
                <ChevronRight size={16} />
              </button>
            )}
          </div>
        )}

        {/* Resultados finales */}
        {exercisesCompleted.size === exercises.length && (
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-[2rem] p-6 text-white text-center">
            <Award size={40} className="mx-auto mb-3" />
            <h3 className="text-xl font-black">¡Excelente!</h3>
            <p className="text-sm opacity-90">Has completado todos los ejercicios de nomenclatura</p>
            <p className="text-lg font-black mt-2">{score} de {exercises.length} correctos</p>
            <button
              onClick={reiniciarEjercicios}
              className="mt-4 px-6 py-2 bg-white/20 hover:bg-white/30 text-white text-xs font-bold rounded-xl transition-all"
            >
              Volver a intentar
            </button>
          </div>
        )}
      </div>
    );
  };

  // ============================================
  // RENDER: TEORÍA
  // ============================================

  const renderTeoria = () => (
    <div className="space-y-6">
      <div className="bg-white border border-[#cbc3d5]/35 rounded-[2rem] p-6 shadow-sm">
        <h3 className="text-sm font-black text-[#181c1e] flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-[#461599]">book</span>
          Fundamentos de Química Orgánica
        </h3>
        
        <div className="space-y-4">
          {/* Carbono */}
          <div className="bg-[#f1f4f7] rounded-xl p-4">
            <h4 className="text-sm font-bold text-[#461599]">🌿 El Carbono</h4>
            <p className="text-xs text-[#494453] mt-1 leading-relaxed">
              El carbono es el elemento base de la química orgánica. Tiene 4 electrones de valencia,
              lo que le permite formar 4 enlaces covalentes. Puede formar cadenas lineales, ramificadas
              y anillos, dando lugar a millones de compuestos orgánicos.
            </p>
          </div>

          {/* Tipos de Carbonos */}
          <div className="bg-[#f1f4f7] rounded-xl p-4">
            <h4 className="text-sm font-bold text-[#461599]">🔬 Tipos de Carbonos</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
              <div className="bg-white rounded-lg p-3 text-center border border-blue-200">
                <p className="text-lg font-black text-blue-500">1°</p>
                <p className="text-[10px] text-[#7b7484]">Primario</p>
                <p className="text-[9px] text-[#7b7484]">Unido a 1 C</p>
              </div>
              <div className="bg-white rounded-lg p-3 text-center border border-purple-200">
                <p className="text-lg font-black text-purple-500">2°</p>
                <p className="text-[10px] text-[#7b7484]">Secundario</p>
                <p className="text-[9px] text-[#7b7484]">Unido a 2 C</p>
              </div>
              <div className="bg-white rounded-lg p-3 text-center border border-amber-200">
                <p className="text-lg font-black text-amber-500">3°</p>
                <p className="text-[10px] text-[#7b7484]">Terciario</p>
                <p className="text-[9px] text-[#7b7484]">Unido a 3 C</p>
              </div>
              <div className="bg-white rounded-lg p-3 text-center border border-red-200">
                <p className="text-lg font-black text-red-500">4°</p>
                <p className="text-[10px] text-[#7b7484]">Cuaternario</p>
                <p className="text-[9px] text-[#7b7484]">Unido a 4 C</p>
              </div>
            </div>
          </div>

          {/* Nomenclatura */}
          <div className="bg-[#f1f4f7] rounded-xl p-4">
            <h4 className="text-sm font-bold text-[#461599]">📝 Nomenclatura IUPAC</h4>
            <div className="space-y-2 mt-2 text-xs text-[#494453]">
              <p><strong>Alcanos:</strong> Sufijo <span className="font-mono text-[#461599]">-ano</span> (Ej: Metano, Etano, Propano)</p>
              <p><strong>Alquenos:</strong> Sufijo <span className="font-mono text-[#461599]">-eno</span> (Ej: Eteno, Propeno, Buteno)</p>
              <p><strong>Alquinos:</strong> Sufijo <span className="font-mono text-[#461599]">-ino</span> (Ej: Etino, Propino, Butino)</p>
              <p><strong>Ramificaciones:</strong> Prefijos <span className="font-mono text-[#461599]">metil-, etil-, propil-</span></p>
              <p><strong>Reglas:</strong> Numerar la cadena principal desde el extremo más cercano al enlace múltiple o ramificación</p>
            </div>
          </div>

          {/* Tabla de Prefijos */}
          <div className="bg-[#f1f4f7] rounded-xl p-4">
            <h4 className="text-sm font-bold text-[#461599]">📊 Prefijos de Carbonos</h4>
            <div className="grid grid-cols-5 gap-2 mt-2 text-xs">
              <div className="bg-white rounded-lg p-2 text-center">
                <p className="font-black text-[#461599]">1</p>
                <p className="text-[#7b7484]">met-</p>
              </div>
              <div className="bg-white rounded-lg p-2 text-center">
                <p className="font-black text-[#461599]">2</p>
                <p className="text-[#7b7484]">et-</p>
              </div>
              <div className="bg-white rounded-lg p-2 text-center">
                <p className="font-black text-[#461599]">3</p>
                <p className="text-[#7b7484]">prop-</p>
              </div>
              <div className="bg-white rounded-lg p-2 text-center">
                <p className="font-black text-[#461599]">4</p>
                <p className="text-[#7b7484]">but-</p>
              </div>
              <div className="bg-white rounded-lg p-2 text-center">
                <p className="font-black text-[#461599]">5</p>
                <p className="text-[#7b7484]">pent-</p>
              </div>
              <div className="bg-white rounded-lg p-2 text-center">
                <p className="font-black text-[#461599]">6</p>
                <p className="text-[#7b7484]">hex-</p>
              </div>
              <div className="bg-white rounded-lg p-2 text-center">
                <p className="font-black text-[#461599]">7</p>
                <p className="text-[#7b7484]">hept-</p>
              </div>
              <div className="bg-white rounded-lg p-2 text-center">
                <p className="font-black text-[#461599]">8</p>
                <p className="text-[#7b7484]">oct-</p>
              </div>
              <div className="bg-white rounded-lg p-2 text-center">
                <p className="font-black text-[#461599]">9</p>
                <p className="text-[#7b7484]">non-</p>
              </div>
              <div className="bg-white rounded-lg p-2 text-center">
                <p className="font-black text-[#461599]">10</p>
                <p className="text-[#7b7484]">dec-</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ============================================
  // RENDER PRINCIPAL
  // ============================================

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#461599] to-[#5e35b1] rounded-[2.25rem] p-6 md:p-8 text-white shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
              <span className="material-symbols-outlined text-3xl">science</span>
              Química Orgánica
            </h2>
            <p className="text-[#ceb8ff] text-sm mt-1">
              Construye cadenas de carbono y aprende nomenclatura IUPAC
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl">
            <span className="text-xs font-bold">🧪 Química del Carbono</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-white/70 backdrop-blur border border-[#cbc3d5]/30 p-2 rounded-2xl">
        <button
          onClick={() => setActiveTab('constructor')}
          className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'constructor'
              ? 'bg-[#461599] text-white shadow'
              : 'text-[#494453] hover:bg-[#f1f4f7]'
          }`}
        >
          <span className="material-symbols-outlined text-sm">construction</span>
          Constructor
        </button>
        <button
          onClick={() => setActiveTab('ejercicios')}
          className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'ejercicios'
              ? 'bg-[#461599] text-white shadow'
              : 'text-[#494453] hover:bg-[#f1f4f7]'
          }`}
        >
          <span className="material-symbols-outlined text-sm">quiz</span>
          Ejercicios
          {exercisesCompleted.size > 0 && (
            <span className="bg-emerald-500 text-white text-[9px] px-2 py-0.5 rounded-full">
              {exercisesCompleted.size}/{exercises.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('teoria')}
          className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'teoria'
              ? 'bg-[#461599] text-white shadow'
              : 'text-[#494453] hover:bg-[#f1f4f7]'
          }`}
        >
          <span className="material-symbols-outlined text-sm">book</span>
          Teoría
        </button>
      </div>

      {/* Contenido */}
      {activeTab === 'constructor' && renderConstructor()}
      {activeTab === 'ejercicios' && renderEjercicios()}
      {activeTab === 'teoria' && renderTeoria()}
    </div>
  );
}