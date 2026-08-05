import { useState, useEffect } from 'react';
import { 
  Beaker, 
  User, 
  Search, 
  Bell, 
  Mail, 
  ChevronRight, 
  CheckCircle, 
  Clock, 
  Sparkles, 
  LogOut, 
  AlertTriangle, 
  X, 
  Cpu, 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Lock, 
  Info,
  Trash2,
  Users,
  Award,
  BookOpen,
  LineChart as LineChartIcon,
  HelpCircle,
  FileSpreadsheet,
  ShieldAlert,
  AlertCircle,
  PlusCircle
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { ELEMENTS, RECENT_ACTIVITIES, PENDING_REPORTS, COURSE_MODULES } from './data';
import { ElementData, ReactionResult, ActivityItem, LabReport, CourseModule } from './types';
import { ALL_118_ELEMENTS, PeriodicElement } from './all118Elements';
import { balanceEquation, getMolarMass } from './balancer';
import OrganicChemistry from './OrganicChemistry';

export default function App() {
  // Authentication Role State - MODIFICADO PARA ADMIN
  const [userRole, setUserRole] = useState<'student' | 'admin' | null>(() => {
    const active = localStorage.getItem('mylab_active_user');
    if (active) {
      try {
        const parsed = JSON.parse(active);
        return parsed.role || 'student';
      } catch {
        return null;
      }
    }
    return null;
  });
  const [userName, setUserName] = useState<string>(() => {
    const active = localStorage.getItem('mylab_active_user');
    if (active) {
      try {
        const parsed = JSON.parse(active);
        return parsed.name || 'Alex Martinez';
      } catch {
        return 'Alex Martinez';
      }
    }
    return '';
  });
  const [userEmail, setUserEmail] = useState<string>(() => {
    const active = localStorage.getItem('mylab_active_user');
    if (active) {
      try {
        const parsed = JSON.parse(active);
        return parsed.email || '';
      } catch {
        return '';
      }
    }
    return '';
  });
  const [userId, setUserId] = useState<number>(() => {
    const active = localStorage.getItem('mylab_active_user');
    if (active) {
      try {
        const parsed = JSON.parse(active);
        return parsed.id || 0;
      } catch {
        return 0;
      }
    }
    return 0;
  });
  const [loginMode, setLoginMode] = useState<'signin' | 'signup'>('signin');
  const [loginEmail, setLoginEmail] = useState<string>('alex.martinez@mylab.edu');
  const [loginPassword, setLoginPassword] = useState<string>('password123');
  const [signupName, setSignupName] = useState<string>('');
  const [signupEmail, setSignupEmail] = useState<string>('');
  const [signupPassword, setSignupPassword] = useState<string>('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState<string>('');

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  
  // Elements & Periodic Table State
  const [selectedElement, setSelectedElement] = useState<any>(ALL_118_ELEMENTS[5]);
  const [elementFilter, setElementFilter] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Simulator State
  const [reactant1, setReactant1] = useState<string>('Sodio');
  const [reactant2, setReactant2] = useState<string>('Agua');
  const [reactionResult, setReactionResult] = useState<ReactionResult | null>(null);
  const [loadingSimulation, setLoadingSimulation] = useState<boolean>(false);
  const [simulationError, setSimulationError] = useState<string | null>(null);

  // Synchronized Matraz Fluid Engine
  const [flaskElements, setFlaskElements] = useState<string[]>([]);
  const [temperature, setTemperature] = useState<number>(25);
  const [potentiometerHeat, setPotentiometerHeat] = useState<number>(0);
  const [pH, setPH] = useState<number>(7.0); 
  const [reactionRate, setReactionRate] = useState<number>(0);
  const [empiricalFormula, setEmpiricalFormula] = useState<string>('');
  const [empiricalResultName, setEmpiricalResultName] = useState<string>('Matraz Vacío');
  const [reactionType, setReactionType] = useState<string>('Sin mezclas');
  const [liquidColor, setLiquidColor] = useState<string>('rgba(226, 232, 240, 0.4)');
  const [computedBalancedEquation, setComputedBalancedEquation] = useState<string>('');
  const [isConservationValid, setIsConservationValid] = useState<boolean>(true);
  const [conservationDiff, setConservationDiff] = useState<number>(0);
  const [reactantsListWeights, setReactantsListWeights] = useState<{ formula: string, molarMass: number }[]>([]);
  const [telemetryHistory, setTelemetryHistory] = useState<{ time: string, Temp: number, pH: number, Reactividad: number }[]>([]);

  // Consultation Modals State
  const [showEstequiometriaModal, setShowEstequiometriaModal] = useState<boolean>(false);
  const [showSeguridadModal, setShowSeguridadModal] = useState<boolean>(false);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);

  // Custom 5-Question Quiz State
  const [quizStarted, setQuizStarted] = useState<boolean>(false);
  const [quizTerminated, setQuizTerminated] = useState<boolean>(false);
  const [currQuestionIndex, setCurrQuestionIndex] = useState<number>(0);
  const [quizSelectedAnswer, setQuizSelectedAnswer] = useState<string | null>(null);
  const [quizAnswerSubmitted, setQuizAnswerSubmitted] = useState<boolean>(false);
  const [quizPoints, setQuizPoints] = useState<number>(0);
  const [validationCode, setValidationCode] = useState<string>('');
  const [timeRemaining, setTimeRemaining] = useState<number>(300);

  const CHEMISTRY_QUIZ_QUESTIONS = [
    {
      question: "Si se disuelven 0.1 moles de HCl en 1 litro de agua pura, ¿cuál será el pH resultante en el matraz de MyLab?",
      options: [
        { key: "A", text: "pH 7.0 (Neutro)", correct: false },
        { key: "B", text: "pH 1.0 (Ácido Fuerte)", correct: true },
        { key: "C", text: "pH 13.0 (Alcalino Fuerte)", correct: false },
        { key: "D", text: "pH 4.0 (Ácido Débil)", correct: false }
      ],
      explanation: "El HCl es un ácido fuerte que se disocia completamente en solución acuosa. El pH se calcula de forma directa como -log[H⁺], por lo tanto: -log(0.1) = 1.0."
    },
    {
      question: "De acuerdo con la Ley de Conservación de la Materia de Lavoisier, la diferencia de masa total entre reactivos y productos balanceados de MyLab debe ser:",
      options: [
        { key: "A", text: "Hasta 2% mayor en base a pérdidas térmicas simuladas", correct: false },
        { key: "B", text: "Aproximadamente 1.000 g/mol por isotropía molecular", correct: false },
        { key: "C", text: "Exactamente 0.000 g/mol, demostrando conservación neta", correct: true },
        { key: "D", text: "Ninguna de las anteriores, la masa no se conserva en sistemas abiertos", correct: false }
      ],
      explanation: "La materia no se crea ni se destruye, solo se transforma. El algoritmo de balanceo algebraico valida que la masa molar total sea idéntica en ambos lados de la ecuación (diferencia de 0.000 g/mol)."
    },
    {
      question: "Si inyectas sodio metálico (Na) directamente al matraz con agua (H₂O), ¿qué gas altamente de combustión se libera con riesgo de ignición?",
      options: [
        { key: "A", text: "Gas Helio inerte (He)", correct: false },
        { key: "B", text: "Dióxido de Carbono (CO₂)", correct: false },
        { key: "C", text: "Hidrógeno elemental gaseoso (H₂)", correct: true },
        { key: "D", text: "Oxígeno gaseoso puro (O₂)", correct: false }
      ],
      explanation: "La reacción extremadamente violenta forma Hidróxido de Sodio (NaOH) y desplaza el Hidrógeno gaseoso (2 Na + 2 H₂O ➔ 2 NaOH + H₂ ↑), el cual es detonante al contacto con el aire caliente."
    },
    {
      question: "Un compuesto químico registra un valor de pH de 13.5 en los sensores de telemetría de MyLab. ¿Cómo se clasifica esta sustancia?",
      options: [
        { key: "A", text: "Ácido Fuerte", correct: false },
        { key: "B", text: "Base Fuerte (Sustancia Alcalina)", correct: true },
        { key: "C", text: "Sal Halógena Solubilizada", correct: false },
        { key: "D", text: "Óxido de Transición Deshidratado", correct: false }
      ],
      explanation: "La escala de pH comprende valores de 0 a 14. Un valor de pH mayor a 11 corresponde a una base con alta concentración de iones de hidróxido (OH⁻), catalogándose como base fuerte."
    },
    {
      question: "Al balancear la ecuación de combustión del metano: CH₄ + O₂ ➔ CO₂ + H₂O mediante álgebra, ¿cuáles son los coeficientes estequiométricos mínimos enteros?",
      options: [
        { key: "A", text: "1, 2, 1, 2", correct: true },
        { key: "B", text: "2, 1, 2, 1", correct: false },
        { key: "C", text: "1, 1, 1, 1", correct: false },
        { key: "D", text: "1, 3, 1, 2", correct: false }
      ],
      explanation: "Al balancear: 1 Carbono en ambos lados. 4 Hidrógenos reactantes requieren un coeficiente 2 en H₂O (4 en total). Para balancear el Oxígeno (2 en CO₂ + 2 en H₂O = 4), se añade el coeficiente 2 al O₂ reactante (1 CH₄ + 2 O₂ ➔ 1 CO₂ + 2 H₂O)."
    }
  ];

  // AI Cognitive Report State
  const [loadingAiReport, setLoadingAiReport] = useState<boolean>(false);
  const [aiReportContent, setAiReportContent] = useState<string>('');

  // Critique Modal Detail State
  const [selectedCritique, setSelectedCritique] = useState<LabReport | null>(null);

  // Custom User Creation lists
  const [studentActivityList, setStudentActivityList] = useState<ActivityItem[]>(RECENT_ACTIVITIES);
  const [pendingReportsList, setPendingReportsList] = useState<LabReport[]>(PENDING_REPORTS);
  const [courseModulesList, setCourseModulesList] = useState<CourseModule[]>(COURSE_MODULES);

  // Notification Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // ============================================
  // 🆕 ESTADOS PARA ADMIN
  // ============================================
  const [adminStats, setAdminStats] = useState<any>(null);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [adminActivities, setAdminActivities] = useState<any[]>([]);
  const [loadingAdmin, setLoadingAdmin] = useState<boolean>(false);

  // ============================================
  // 🆕 FUNCIONES PARA BASE DE DATOS
  // ============================================
  
  // Guardar simulación en la base de datos
  const saveSimulationToDB = async (reactants: string, result: ReactionResult) => {
    try {
      const user = JSON.parse(localStorage.getItem('mylab_active_user') || '{}');
      if (!user.id) return;
      
      await fetch('/api/simulations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          reactants: reactants,
          result_name: result.name,
          result_type: result.type,
          equation: result.equation,
          animation_type: result.animationType,
          glow_color: result.glowColor
        })
      });
    } catch (error) {
      console.error('Error guardando simulación:', error);
    }
  };

  // Guardar resultado de quiz
  const saveQuizResult = async (score: number, total: number, passed: boolean, code: string) => {
    try {
      const user = JSON.parse(localStorage.getItem('mylab_active_user') || '{}');
      if (!user.id) return;
      
      await fetch('/api/quiz-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          score: score,
          total_questions: total,
          passed: passed,
          validation_code: code
        })
      });
      
      if (passed) {
        const userData = JSON.parse(localStorage.getItem('mylab_active_user') || '{}');
        userData.xp_points = (userData.xp_points || 0) + (score * 50);
        localStorage.setItem('mylab_active_user', JSON.stringify(userData));
      }
    } catch (error) {
      console.error('Error guardando resultado de quiz:', error);
    }
  };

  // Cargar actividades desde la base de datos
  const loadActivitiesFromDB = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('mylab_active_user') || '{}');
      if (!user.id) return;
      
      const response = await fetch(`/api/activities/${user.id}`);
      const data = await response.json();
      if (data.length > 0) {
        setStudentActivityList(data.map((act: any) => ({
          id: act.id.toString(),
          student: user.name,
          initials: user.name.charAt(0).toUpperCase(),
          action: act.action,
          time: new Date(act.created_at).toLocaleTimeString(),
          bgAvatarClass: 'bg-[#eaddff]',
          avatarTextColor: 'text-[#24005b]'
        })));
      }
    } catch (error) {
      console.error('Error cargando actividades:', error);
    }
  };

  // Cargar reportes desde la base de datos
  const loadReportsFromDB = async () => {
    try {
      const response = await fetch('/api/reports');
      const data = await response.json();
      if (data.length > 0) {
        setPendingReportsList(data.map((rep: any) => ({
          id: rep.id.toString(),
          title: rep.title,
          sender: rep.sender_name || 'Usuario',
          priority: rep.priority,
          content: rep.content
        })));
      }
    } catch (error) {
      console.error('Error cargando reportes:', error);
    }
  };

  // ============================================
  // 🆕 FUNCIONES PARA ADMIN
  // ============================================

  // Cargar estadísticas del sistema
  const loadAdminStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      const data = await response.json();
      setAdminStats(data);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  // Cargar lista de usuarios
  const loadAdminUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      setAdminUsers(data);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
    }
  };

  // Cargar actividades del sistema
  const loadAdminActivities = async () => {
    try {
      const response = await fetch('/api/admin/activities');
      const data = await response.json();
      setAdminActivities(data);
    } catch (error) {
      console.error('Error cargando actividades:', error);
    }
  };

  // Cambiar rol de usuario
  const changeUserRole = async (userId: number, newRole: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      
      if (response.ok) {
        showToast(`Rol de usuario actualizado a ${newRole}`);
        loadAdminUsers();
      } else {
        showToast('Error al actualizar rol');
      }
    } catch (error) {
      console.error('Error:', error);
      showToast('Error al actualizar rol');
    }
  };

  // Eliminar usuario
  const deleteUser = async (userId: number) => {
    if (!confirm('¿Estás seguro de eliminar este usuario?')) return;
    
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        showToast('Usuario eliminado exitosamente');
        loadAdminUsers();
        loadAdminStats();
      } else {
        showToast('Error al eliminar usuario');
      }
    } catch (error) {
      console.error('Error:', error);
      showToast('Error al eliminar usuario');
    }
  };

  // ============================================
  // FIN DE FUNCIONES NUEVAS
  // ============================================

  // Initialize Users in localStorage
  useEffect(() => {
    const existing = localStorage.getItem('mylab_users');
    if (!existing) {
      const defaultUsers = [
        { name: 'Alex Martinez', email: 'alex.martinez@mylab.edu', password: 'password123' }
      ];
      localStorage.setItem('mylab_users', JSON.stringify(defaultUsers));
    }
  }, []);

  // Timer Countdown loop for active Quizzes
  useEffect(() => {
    let timer: any;
    if (activeTab === 'quizzes' && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [activeTab, timeRemaining]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const formattedTime = () => {
    const min = Math.floor(timeRemaining / 60);
    const sec = timeRemaining % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  // Matraz Direct Injection
  const addElementToFlask = (symbol: string) => {
    setFlaskElements(prev => {
      const updated = [...prev, symbol];
      return updated;
    });
    const foundText = ALL_118_ELEMENTS.find(e => e.symbol === symbol)?.name || symbol;
    showToast(`Inyectado al matraz: 1 átomo de ${foundText} (${symbol})`);
  };

  const clearFlask = () => {
    setFlaskElements([]);
    setTelemetryHistory([]);
    setPotentiometerHeat(0);
    setReactionResult(null);
    showToast('Matraz limpio y sensores reiniciados.');
  };

  function getEmpiricalFormula(elemList: string[]): string {
    if (elemList.length === 0) return '';
    const counts: Record<string, number> = {};
    elemList.forEach(s => {
      counts[s] = (counts[s] || 0) + 1;
    });
    
    const sortedSymbols = Object.keys(counts).sort((a, b) => {
      if (a === 'C') return -1;
      if (b === 'C') return 1;
      if (a === 'H' && b !== 'C') return -1;
      if (b === 'H' && a !== 'C') return 1;
      return a.localeCompare(b);
    });
    
    return sortedSymbols.map(sym => `${sym}${counts[sym] > 1 ? counts[sym] : ''}`).join('');
  }

  // Reactive chemistry effect
  useEffect(() => {
    if (flaskElements.length === 0) {
      setEmpiricalFormula('');
      setEmpiricalResultName('Vacío');
      setReactionType('Sin mezclas');
      setLiquidColor('rgba(203, 213, 225, 0.2)');
      setPH(7.0);
      setTemperature(25 + potentiometerHeat);
      setReactionRate(0);
      setComputedBalancedEquation('');
      setReactantsListWeights([]);
      setConservationDiff(0);
      setIsConservationValid(true);
      return;
    }
    
    const formula = getEmpiricalFormula(flaskElements);
    setEmpiricalFormula(formula);
    
    let computedPH = 7.0;
    let tempUptake = 0;
    let baseRate = 0;
    let name = 'Dispersión Química Genérica';
    let type = 'Mezcla Heterogénea Escolar';
    let color = '#a78bfa';
    let desc = '';
    let animType: 'neutral' | 'bubbling' | 'colorChange' | 'explosion' | 'precipitation' = 'neutral';
    
    if (formula === 'H2O') {
      name = 'Agua Destilada';
      type = 'Líquido Neutro Puro';
      color = '#38bdf8';
      computedPH = 7.0;
      tempUptake = 1;
      baseRate = 2;
      animType = 'bubbling';
      desc = 'H₂O en estado de equilibrio pacífico. Solución perfectamente inocua.';
    } else if (formula === 'HCl') {
      name = 'Ácido Clorhídrico';
      type = 'Ácido Fuerte Mineral';
      color = '#fbbf24';
      computedPH = 1.0;
      tempUptake = 14;
      baseRate = 20;
      animType = 'colorChange';
      desc = 'HCl diluido. Desprende un pH sumamente bajo con iones de hidrógeno activos.';
    } else if (formula === 'HNaO' || formula === 'NaOH') {
      name = 'Hidróxido de Sodio';
      type = 'Base Fuerte Alcalina';
      color = '#ec4899';
      computedPH = 13.5;
      tempUptake = 26;
      baseRate = 35;
      animType = 'bubbling';
      desc = 'NaOH concentrado. Solución hidróxida cáustica con coloración rosa indicadora.';
    } else if (formula === 'Fe2O3') {
      name = 'Óxido de Hierro (III)';
      type = 'Óxido de Metal de Transición';
      color = '#dc2626';
      computedPH = 6.8;
      tempUptake = 2;
      baseRate = 8;
      animType = 'precipitation';
      desc = 'Fe₂O₃ precipitado de color bermellón que desciende lentamente de densidad.';
    } else if (formula === 'ClNa' || formula === 'NaCl') {
      name = 'Cloruro de Sodio';
      type = 'Sal Halógena Neutra';
      color = '#f1f5f9';
      computedPH = 7.0;
      tempUptake = 3;
      baseRate = 12;
      animType = 'precipitation';
      desc = 'Sal de mesa disuelta. Soluto salino estable y diluido en perfectas condiciones.';
    } else if (formula === 'CH4') {
      name = 'Gas Metano Envasado';
      type = 'Hidrocarburo Alcano Orgánico';
      color = '#86efac';
      computedPH = 7.0;
      tempUptake = 0;
      baseRate = 15;
      animType = 'bubbling';
      desc = 'CH₄ en solución gaseosa efervescente de hidrocarburo simple.';
    } else if (formula === 'H3N' || formula === 'NH3') {
      name = 'Solución de Amoníaco';
      type = 'Base Nitrogenada Débil';
      color = '#818cf8';
      computedPH = 11.5;
      tempUptake = 5;
      baseRate = 22;
      animType = 'bubbling';
      desc = 'NH₃ liberando vapores nitrosos alcalinos típicos.';
    } else if (formula === 'Cl' || formula === 'Cl2') {
      name = 'Gas Cloro Molecular';
      type = 'Halógeno Comburente Tópico';
      color = '#a3e635';
      computedPH = 3.8;
      tempUptake = 6;
      baseRate = 28;
      animType = 'colorChange';
      desc = 'Gas cloro nocivo disuelto. Posee alta tasa corrosiva.';
    } else if (formula === 'O2') {
      name = 'Oxígeno Diatómico Gaseoso';
      type = 'Gas Comburente Libre';
      color = '#93c5fd';
      computedPH = 7.0;
      tempUptake = 0;
      baseRate = 5;
      animType = 'bubbling';
      desc = 'Inyección de O₂ puro promoviendo efervescencia.';
    } else if (formula === 'H2') {
      name = 'Gas de Hidrógeno Altamente Combustible';
      type = 'Gas Diatómico Inflamable';
      color = '#f87171';
      computedPH = 7.0;
      tempUptake = 1;
      baseRate = 18;
      animType = 'bubbling';
      desc = 'H₂ molecular flotando rápidamente a la superficie de la solución.';
    } else {
      let hash = 0;
      for (let i = 0; i < formula.length; i++) {
        hash = formula.charCodeAt(i) + ((hash << 5) - hash);
      }
      const hue = Math.abs(hash % 360);
      color = `hsl(${hue}, 70%, 60%)`;
      
      let acids = 0;
      let bases = 0;
      flaskElements.forEach(s => {
        if (['Cl', 'S', 'N', 'F', 'P'].includes(s)) acids += 3.0;
        if (['Na', 'K', 'Li', 'Ca', 'Mg'].includes(s)) bases += 3.5;
      });
      
      if (acids > bases) {
        computedPH = Math.max(1.0, 7.0 - (acids - bases));
      } else if (bases > acids) {
        computedPH = Math.min(14.0, 7.0 + (bases - acids));
      } else {
        computedPH = 7.0;
      }
      
      const unique = Array.from(new Set(flaskElements));
      if (unique.includes('Na') && unique.includes('O')) {
        tempUptake = 45;
        baseRate = 85;
        animType = 'explosion';
        desc = 'Reacción alcalina sumamente exotérmica e inestable con amago de precipitado.';
      } else if (unique.includes('H') && unique.includes('Cl')) {
        tempUptake = 22;
        baseRate = 60;
        animType = 'colorChange';
        desc = 'Reacción ácida moderadamente violenta y exotérmica.';
      } else {
        tempUptake = Math.min(40, unique.length * 6);
        baseRate = Math.min(100, unique.length * 15);
        animType = 'colorChange';
        desc = `Mezcla molecular asincrónica de ${unique.join(', ')}.`;
      }
    }
    
    const finalTemp = Math.round(25 + tempUptake + (potentiometerHeat * 0.75));
    const finalRate = Math.min(100, baseRate + Math.round(potentiometerHeat * 0.4));
    
    setPH(parseFloat(computedPH.toFixed(2)));
    setTemperature(finalTemp);
    setReactionRate(finalRate);
    setEmpiricalResultName(name);
    setReactionType(type);
    setLiquidColor(color);
    
    let rawEquation = '';
    const itemsSet = new Set(flaskElements);
    if (itemsSet.has('H') && itemsSet.has('O')) {
      rawEquation = 'H2 + O2 -> H2O';
    } else if (itemsSet.has('Na') && itemsSet.has('Cl')) {
      rawEquation = 'Na + Cl2 -> NaCl';
    } else if (itemsSet.has('Fe') && itemsSet.has('O')) {
      rawEquation = 'Fe + O2 -> Fe2O3';
    } else if (itemsSet.has('H') && itemsSet.has('Cl') && itemsSet.has('Na') && itemsSet.has('O')) {
      rawEquation = 'HCl + NaOH -> NaCl + H2O';
    } else if (itemsSet.has('N') && itemsSet.has('H')) {
      rawEquation = 'N2 + H2 -> NH3';
    } else if (itemsSet.has('H') && itemsSet.has('Cl')) {
      rawEquation = 'H2 + Cl2 -> HCl';
    } else if (itemsSet.has('C') && itemsSet.has('O')) {
      rawEquation = 'C + O2 -> CO2';
    } else if (itemsSet.has('C') && itemsSet.has('H')) {
      rawEquation = 'C + H2 -> CH4';
    } else {
      if (flaskElements.length >= 2) {
        const uni = Array.from(new Set(flaskElements));
        const divider = Math.ceil(uni.length / 2);
        const lComp = uni.slice(0, divider).join('');
        const rComp = uni.slice(divider).join('');
        rawEquation = `${lComp} + ${rComp} -> ${formula}`;
      } else {
        rawEquation = `${formula} -> ${formula}`;
      }
    }
    
    const balResult = balanceEquation(rawEquation);
    if (balResult.success) {
      setComputedBalancedEquation(balResult.balancedString);
      setIsConservationValid(balResult.massDifference < 0.001);
      setConservationDiff(balResult.massDifference);
      setReactantsListWeights(balResult.reactants.map(r => ({
        formula: `${r.coefficient > 1 ? r.coefficient : ''} ${r.formula}`,
        molarMass: r.molarMass
      })));
    } else {
      setComputedBalancedEquation(rawEquation);
      setIsConservationValid(true);
      setConservationDiff(0.000);
      setReactantsListWeights(flaskElements.map(x => ({ formula: x, molarMass: getMolarMass(x) })));
    }
    
    setReactionResult({
      equation: balResult.success ? balResult.balancedString : rawEquation,
      name: name,
      type: type,
      visuals: desc + ` Masa molar calculada de reactivo(s): ${balResult.totalReactantsMass.toFixed(3)} g/mol.`,
      funFact: `La efervescencia y reactividad marcan una velocidad del ${finalRate}%.`,
      animationType: animType,
      glowColor: color,
      warning: computedPH < 3 || computedPH > 11 
        ? 'Protocolo Crítico: PH extremo detectado. Se precisa uso obligatorio de lentes protectores y guantes de nitrilo.' 
        : 'Sustancia estable. Cumple con los protocolos normales de simulación escolar de MyLab.'
    });
    
  }, [flaskElements, potentiometerHeat]);

  // Periodic Telemetry History collector
  useEffect(() => {
    if (flaskElements.length === 0) return;
    
    if (telemetryHistory.length === 0) {
      const initialSpark = Array.from({ length: 8 }).map((_, index) => {
        const timeOffset = new Date(Date.now() - (8 - index) * 2000);
        return {
          time: `${timeOffset.getHours().toString().padStart(2, '0')}:${timeOffset.getMinutes().toString().padStart(2, '0')}:${timeOffset.getSeconds().toString().padStart(2, '0')}`,
          Temp: Math.max(10, temperature + Math.round(Math.random() * 4 - 2)),
          pH: Math.max(0, pH),
          Reactividad: Math.max(0, reactionRate)
        };
      });
      setTelemetryHistory(initialSpark);
    }

    const interval = setInterval(() => {
      const now = new Date();
      const timeLabel = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      
      setTelemetryHistory(prev => {
        const item = {
          time: timeLabel,
          Temp: temperature,
          pH: pH,
          Reactividad: reactionRate
        };
        const nextList = [...prev, item];
        if (nextList.length > 10) {
          return nextList.slice(nextList.length - 10);
        }
        return nextList;
      });
    }, 2000);
    
    return () => clearInterval(interval);
  }, [flaskElements, temperature, pH, reactionRate]);

  const handleLogin = async (role: 'student' | 'admin', name?: string) => {
    setUserRole(role);
    const resolvedName = name || 'Alex Martinez';
    setUserName(resolvedName);
    setActiveTab('dashboard');
    
    setTimeout(() => {
      loadActivitiesFromDB();
      loadReportsFromDB();
      if (role === 'admin') {
        loadAdminStats();
        loadAdminUsers();
        loadAdminActivities();
      }
    }, 500);
    
    showToast(`Sesión iniciada como ${resolvedName} (${role})`);
  };

  const handleSimulateCustomReaction = async (customReactants?: string) => {
    setLoadingSimulation(true);
    setSimulationError(null);
    setReactionResult(null);

    const queryReactants = customReactants || `${reactant1} y ${reactant2}`;
    
    if (!queryReactants.trim()) {
      setSimulationError('Por favor introduce reactivos válidos.');
      setLoadingSimulation(false);
      return;
    }

    try {
      const response = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reactants: queryReactants }),
      });
      const data = await response.json();
      if (data.error) {
        setSimulationError(data.error);
      } else {
        setReactionResult(data);
        await saveSimulationToDB(queryReactants, data);
        showToast(`¡Reacción obtenida con éxito: ${data.name}!`);
      }
    } catch (err) {
      const fallbackResult = {
        equation: `${reactant1} + ${reactant2} ➔ Reacción Térmica`,
        name: 'Transformación Exotérmica',
        type: 'Síntesis Estructural',
        visuals: 'Se percibe desprendimiento moderado de vapores y un cambio progresivo de color en el tubo de ensayo.',
        funFact: 'La química virtual de MyLab te ayuda a visualizar y anticipar riesgos antes de ingresar al laboratorio físico.',
        animationType: 'bubbling' as const,
        glowColor: '#5e35b1',
        warning: 'Usa anteojos de seguridad y campana de extracción de gases.'
      };
      setReactionResult(fallbackResult);
      await saveSimulationToDB(queryReactants, fallbackResult);
      showToast('Reacción simulada con soporte de contingencia.');
    } finally {
      setLoadingSimulation(false);
    }
  };

  const handleAiInsightGeneration = async (subject: string) => {
    setLoadingAiReport(true);
    try {
      const response = await fetch('/api/ai-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject }),
      });
      const data = await response.json();
      if (data.error) {
        setAiReportContent('Ocurrió un error al contactar al motor predictivo. Confirma la clave API.');
      } else {
        setAiReportContent(data.report);
        showToast('Insight cognitivo predictivo de MyLab generado.');
      }
    } catch (err) {
      setAiReportContent('El motor cognitivo generó el siguiente reporte estimado: Alex Martinez demuestra un progreso idóneo en estequiometría molecular. Se recomienda potenciar la ejercitación autónoma de balanceo redox en reacciones acuosas complejas y disociación ácida.');
      showToast('Insight generado por contingencia.');
    } finally {
      setLoadingAiReport(false);
    }
  };

  // Filters for Periodic Table Categories
  const getFilteredElements = () => {
    return ELEMENTS.filter(el => {
      const matchesSearch = searchQuery === '' || 
        el.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        el.symbol.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (elementFilter === 'Todos') return matchesSearch;
      if (elementFilter === 'No Metales' && el.category === 'No Metal') return matchesSearch;
      if (elementFilter === 'Metales Alcalinos' && el.category === 'Metales Alcalinos') return matchesSearch;
      if (elementFilter === 'Gases Nobles' && el.category === 'Gases Nobles') return matchesSearch;
      if (elementFilter === 'Halógenos' && el.category === 'Halógenos') return matchesSearch;
      if (elementFilter === 'Metaloides' && el.category === 'Metaloides') return matchesSearch;
      if (elementFilter === 'Metales de Transición' && el.category === 'Metales de Transición') return matchesSearch;
      return false;
    });
  };

  const handleCustomLogin = async () => {
    if (!loginEmail || !loginPassword) {
      showToast('Por favor completa todos los campos de acceso.');
      return;
    }

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      
      const data = await response.json();
      
      if (data.error) {
        showToast('Credenciales incorrectas. Intenta con alex.martinez@mylab.edu (clave: password123) o regístrate.');
        return;
      }
      
      localStorage.setItem('mylab_active_user', JSON.stringify(data));
      setUserRole(data.role || 'student');
      setUserName(data.name);
      setUserEmail(data.email);
      setUserId(data.id);
      setActiveTab('dashboard');
      
      setTimeout(() => {
        loadActivitiesFromDB();
        loadReportsFromDB();
        if (data.role === 'admin') {
          loadAdminStats();
          loadAdminUsers();
          loadAdminActivities();
        }
      }, 500);
      
      showToast(`¡Sesión iniciada con éxito! Bienvenido, ${data.name}.`);
    } catch (error) {
      showToast('Error de conexión. Intenta nuevamente.');
    }
  };

  const handleCustomSignup = async () => {
    // Validar campos obligatorios
    if (!signupName || !signupEmail || !signupPassword || !signupConfirmPassword) {
      showToast('⚠️ Por favor diligencia TODOS los campos del registro.');
      return;
    }

    // Validar que las contraseñas coincidan
    if (signupPassword !== signupConfirmPassword) {
      showToast('❌ Las contraseñas no coinciden. Verifica e intenta nuevamente.');
      return;
    }

    // Validar longitud mínima de contraseña
    if (signupPassword.length < 6) {
      showToast('❌ La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: signupName,
          email: signupEmail,
          password: signupPassword,
          role: 'student'
        }),
      });
      
      const data = await response.json();
      
      if (data.error) {
        showToast(`❌ ${data.error}`);
        return;
      }
      
      localStorage.setItem('mylab_active_user', JSON.stringify(data));
      setUserRole('student');
      setUserName(data.name);
      setUserEmail(data.email);
      setUserId(data.id);
      setLoginMode('signin');
      setActiveTab('dashboard');
      
      // Limpiar campos de registro
      setSignupName('');
      setSignupEmail('');
      setSignupPassword('');
      setSignupConfirmPassword('');
      
      showToast(`✅ ¡Cuenta creada con éxito! Bienvenido, ${data.name}.`);
    } catch (error) {
      showToast('❌ Error de conexión. Intenta nuevamente.');
    }
  };

  const handleCustomLogout = () => {
    localStorage.removeItem('mylab_active_user');
    setUserRole(null);
    setUserName('');
    setUserEmail('');
    setUserId(0);
    showToast('Has cerrado tu sesión de forma segura.');
  };

  // Render Access / Login Screen
  if (!userRole) {
    return (
      <div className="min-h-screen bg-[#f7fafd] flex items-center justify-center p-4 md:p-12 relative overflow-hidden font-sans text-[#181c1e] animated-bg">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#5e35b1]/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#ffdad6]/20 rounded-full blur-3xl"></div>

        <div className="relative w-full max-w-5xl grid md:grid-cols-12 gap-8 items-center bg-white/70 backdrop-blur-xl border border-white/50 shadow-2xl rounded-[2.5rem] p-6 md:p-10 z-10 animate-fade-in">
          <div className="md:col-span-6 hidden md:flex flex-col justify-between h-full space-y-8 pr-4">
            <div className="flex items-center gap-2.5">
              <div className="w-12 h-12 bg-[#461599] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[#461599]/20">
                <span className="material-symbols-outlined text-2xl filled">science</span>
              </div>
              <span className="text-2xl font-black text-[#461599] tracking-tight">MyLab</span>
            </div>

            <div className="space-y-6 text-center md:text-left">
              <h2 className="text-4xl font-extrabold text-[#181c1e] leading-[1.1] tracking-tight">
                Explora el mundo de la <span className="text-[#461599]">química</span> virtual de forma autónoma
              </h2>
              <p className="text-[#494453] text-[16px] leading-relaxed max-w-md">
                Un entorno interactivo para estudiantes que asume el reto del auto-aprendizaje químico mediante simulaciones y cuestionarios objetivos continuos.
              </p>
            </div>

            <div className="relative w-64 h-64 mx-auto md:mx-0 flex items-center justify-center">
              <div className="absolute inset-2 border-2 border-dashed border-[#cbc3d5] rounded-full animate-[spin_10s_linear_infinite]"></div>
              <div className="absolute inset-8 border border-dashed border-[#5e35b1]/60 rounded-full animate-[spin_6s_linear_infinite_reverse]"></div>
              <div className="absolute inset-16 border-2 border-dashed border-[#fdd34d] rounded-full animate-[spin_4s_linear_infinite]"></div>
              
              <div className="w-16 h-16 bg-[#461599] text-white rounded-full flex items-center justify-center shadow-xl shadow-[#461599]/30 relative z-10">
                <Beaker size={24} className="animate-pulse" />
              </div>
              
              <div className="absolute top-[15px] left-[110px] w-4 h-4 bg-[#fdd34d] rounded-full shadow"></div>
              <div className="absolute bottom-[30px] right-[40px] w-3 h-3 bg-[#ffacc2] rounded-full shadow"></div>
            </div>

            <div className="text-xs text-[#7b7484] flex items-center gap-2 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping"></span>
              <span>Laboratorio asincrónico estudiantil online</span>
            </div>
          </div>

          <div className="md:col-span-6 w-full">
            <div className="bg-white/85 border border-[#cbc3d5]/30 rounded-[2rem] p-6 md:p-8 shadow-xl flex flex-col space-y-6">
              
              <div className="space-y-1.5">
                <div className="md:hidden flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-[#461599] rounded-xl flex items-center justify-center text-white">
                    <span className="material-symbols-outlined text-sm filled">science</span>
                  </div>
                  <span className="text-lg font-black text-[#461599]">MyLab</span>
                </div>
                
                <h3 className="text-2xl font-bold text-[#181c1e] tracking-tight">
                  {loginMode === 'signin' ? 'Iniciar Sesión' : 'Registrar Cuenta'}
                </h3>
                <p className="text-xs text-[#494453]">
                  {loginMode === 'signin' 
                    ? 'Ingresa tus credenciales estudiantiles autónomas para continuar.' 
                    : 'Crea tu cuenta de estudiante única para registrar y guardar tu progreso.'}
                </p>
              </div>

              {loginMode === 'signin' ? (
                <div className="space-y-4 text-left">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#494453]">Correo Electrónico</label>
                    <input 
                      type="email" 
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="alex.martinez@mylab.edu"
                      className="w-full px-4 py-3 rounded-xl border border-[#cbc3d5]/40 bg-[#f1f4f7] outline-none text-sm font-semibold focus:border-[#461599] focus:bg-white transition-all text-[#181c1e]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#494453]">Contraseña</label>
                    <input 
                      type="password" 
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 rounded-xl border border-[#cbc3d5]/40 bg-[#f1f4f7] outline-none text-sm font-semibold focus:border-[#461599] focus:bg-white transition-all text-[#181c1e]"
                    />
                  </div>

                  <button 
                    onClick={handleCustomLogin}
                    className="w-full py-3.5 bg-[#461599] hover:bg-[#5e35b1] text-white text-sm font-bold rounded-xl shadow-lg shadow-[#461599]/20 transition-all transform hover:translate-y-[-1px] cursor-pointer"
                  >
                    Ingresar al Laboratorio
                  </button>

                  <div className="text-center pt-2">
                    <p className="text-xs text-[#7b7484] font-semibold">
                      ¿No tienes cuenta?{' '}
                      <button 
                        onClick={() => setLoginMode('signup')}
                        className="text-[#461599] font-black hover:underline cursor-pointer bg-transparent border-none p-0 inline"
                      >
                        Créala ahora mismo
                      </button>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 text-left">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#494453]">Nombre Completo</label>
                    <input 
                      type="text" 
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      placeholder="Alex Martinez"
                      className="w-full px-4 py-3 rounded-xl border border-[#cbc3d5]/40 bg-[#f1f4f7] outline-none text-sm font-semibold focus:border-[#461599] focus:bg-white transition-all text-[#181c1e]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#494453]">Correo de Registro</label>
                    <input 
                      type="email" 
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder="tu.nombre@mylab.edu"
                      className="w-full px-4 py-3 rounded-xl border border-[#cbc3d5]/40 bg-[#f1f4f7] outline-none text-sm font-semibold focus:border-[#461599] focus:bg-white transition-all text-[#181c1e]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#494453]">Establecer Contraseña</label>
                    <input 
                      type="password" 
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full px-4 py-3 rounded-xl border border-[#cbc3d5]/40 bg-[#f1f4f7] outline-none text-sm font-semibold focus:border-[#461599] focus:bg-white transition-all text-[#181c1e]"
                    />
                    <p className="text-[10px] text-[#7b7484] mt-1">🔒 La contraseña debe tener al menos 6 caracteres</p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#494453]">Confirmar Contraseña</label>
                    <input 
                      type="password" 
                      value={signupConfirmPassword}
                      onChange={(e) => setSignupConfirmPassword(e.target.value)}
                      placeholder="Vuelve a escribir tu contraseña"
                      className="w-full px-4 py-3 rounded-xl border border-[#cbc3d5]/40 bg-[#f1f4f7] outline-none text-sm font-semibold focus:border-[#461599] focus:bg-white transition-all text-[#181c1e]"
                    />
                    {signupConfirmPassword && (
                      <div className={`text-[10px] font-bold mt-1 flex items-center gap-1 ${
                        signupPassword === signupConfirmPassword 
                          ? 'text-emerald-600' 
                          : 'text-red-500'
                      }`}>
                        {signupPassword === signupConfirmPassword 
                          ? '✅ Las contraseñas coinciden' 
                          : '❌ Las contraseñas no coinciden'}
                      </div>
                    )}
                  </div>

                  <button 
                    onClick={handleCustomSignup}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all transform hover:translate-y-[-1px] cursor-pointer"
                  >
                    Crear mi Registro Estudiantil
                  </button>

                  <div className="text-center pt-2">
                    <p className="text-xs text-[#7b7484] font-semibold">
                      ¿Ya tienes cuenta activa?{' '}
                      <button 
                        onClick={() => setLoginMode('signin')}
                        className="text-[#461599] font-black hover:underline cursor-pointer bg-transparent border-none p-0 inline"
                      >
                        Inicia Sesión
                      </button>
                    </p>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    );
  }

  // Regular dashboard portal frame
  return (
    <div className="min-h-screen bg-[#f7fafd] flex font-sans text-[#181c1e] relative">
      
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#181c1e] text-white px-5 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10 animate-slide-in">
          <Sparkles className="text-[#fdd34d] shrink-0" size={18} />
          <p className="text-xs font-bold">{toastMessage}</p>
          <button onClick={() => setToastMessage(null)} className="text-[#7b7484] hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {selectedCritique && (
        <div className="fixed inset-0 z-50 bg-[#181c1e]/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-6 md:p-8 max-w-xl w-full shadow-2xl border border-white relative space-y-5 animate-scale-in">
            <button 
              onClick={() => setSelectedCritique(null)}
              className="absolute top-5 right-5 text-[#7b7484] hover:text-[#ba1a1a] transition-all p-1.5 rounded-full hover:bg-[#f1f4f7]"
            >
              <X size={18} />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#461599]/10 rounded-2xl flex items-center justify-center text-[#461599]">
                <span className="material-symbols-outlined text-2xl">lab_research</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#461599] tracking-wider px-2 py-0.5 rounded-full bg-[#461599]/10">Informe escolar</span>
                <h3 className="text-xl font-bold text-[#181c1e] tracking-tight">{selectedCritique.title}</h3>
                <p className="text-xs text-[#7b7484]">Expedido por: <span className="font-bold text-[#181c1e]">{selectedCritique.sender}</span></p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#f1f4f7] border border-[#cbc3d5]/30 text-sm leading-relaxed text-[#494453] max-h-56 overflow-y-auto custom-scrollbar italic">
              "{selectedCritique.content}"
            </div>

            <div className="bg-[#ffe087]/20 border border-[#fdd34d]/60 rounded-2xl p-4 flex gap-3 text-xs leading-relaxed text-[#725b00]">
              <Sparkles size={16} className="shrink-0 text-[#735c00]" />
              <div>
                <p className="font-bold mb-0.5">Asistente Calificador IA</p>
                <p>Las fórmulas estequiométricas mostradas en este borrador de '{selectedCritique.title}' reflejan precisión de laboratorio del 98%. Se sugiere aprobar la calificación para actualizar los puntos de honor.</p>
              </div>
            </div>

            <div className="flex gap-2 pt-2 justify-end">
              <button 
                onClick={() => {
                  showToast(`Aprobado reporte de ${selectedCritique.sender}. +150 XP asignados.`);
                  setPendingReportsList(prev => prev.filter(r => r.id !== selectedCritique.id));
                  const newItem: ActivityItem = {
                    id: Math.random().toString(),
                    student: 'Dra. Elena Vega',
                    initials: 'EV',
                    action: `Aprobó informe de ${selectedCritique.title} para ${selectedCritique.sender}`,
                    time: 'Hace un momento',
                    bgAvatarClass: 'bg-[#ffd9e1]',
                    avatarTextColor: 'text-[#760038]'
                  };
                  setStudentActivityList(prev => [newItem, ...prev]);
                  setSelectedCritique(null);
                }}
                className="px-5 py-2.5 bg-[#461599] text-white text-xs font-bold rounded-xl hover:bg-[#5e35b1] shadow-lg shadow-[#461599]/10 transition-colors"
              >
                Aprobar y Registrar (+150 XP)
              </button>
              <button 
                onClick={() => {
                  showToast(`Notificado ${selectedCritique.sender} para reelaboración.`);
                  setSelectedCritique(null);
                }}
                className="px-4 py-2.5 border border-[#cbc3d5] hover:bg-[#f1f4f7] text-xs font-bold rounded-xl transition-all"
              >
                Solicitar Corrección
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LEFT SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-64 fixed left-0 top-0 h-screen bg-white border-r border-[#cbc3d5]/30 p-5 justify-between z-35 shadow-sm">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#461599] rounded-xl flex items-center justify-center text-white shadow-md shadow-[#461599]/20">
              <span className="material-symbols-outlined text-xl filled">science</span>
            </div>
            <div>
              <h1 className="text-lg font-black text-[#461599] tracking-tight leading-none">MyLab</h1>
              <p className="text-[10px] text-[#7b7484] font-bold tracking-wider uppercase">Laboratorio Virtual</p>
            </div>
          </div>

          <button 
            onClick={() => {
              setActiveTab('simulator');
              showToast('Reactor químico de MyLab online.');
            }}
            className="w-full p-4 bg-[#f1f4f7] hover:bg-[#ebeef1] border border-[#cbc3d5]/30 rounded-2xl flex items-center justify-between text-left transition-all"
          >
            <div>
              <span className="text-[9px] font-bold text-[#7b7484] tracking-widest block uppercase">REACTOR</span>
              <span className="text-sm font-bold text-[#181c1e]">Experimentar</span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-[#461599] text-white flex items-center justify-center shadow-lg shadow-[#461599]/20">
              <Beaker size={16} />
            </div>
          </button>

          <nav className="flex flex-col space-y-1">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-xs font-bold transition-all ${
                activeTab === 'dashboard' 
                  ? 'bg-[#461599] text-white shadow-md shadow-[#461599]/15' 
                  : 'text-[#494453] hover:bg-[#f1f4f7]'
              }`}
            >
              <span className="material-symbols-outlined text-lg">dashboard</span>
              <span>Dashboard</span>
            </button>

            <button 
              onClick={() => setActiveTab('periodic')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-xs font-bold transition-all ${
                activeTab === 'periodic' 
                  ? 'bg-[#461599] text-white shadow-md shadow-[#461599]/15' 
                  : 'text-[#494453] hover:bg-[#f1f4f7]'
              }`}
            >
              <span className="material-symbols-outlined text-lg">grid_view</span>
              <span>Tabla Periódica</span>
            </button>

            <button 
              onClick={() => {
                setActiveTab('simulator');
                if(!reactionResult){
                  handleSimulateCustomReaction();
                }
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-xs font-bold transition-all ${
                activeTab === 'simulator' 
                  ? 'bg-[#461599] text-white shadow-md shadow-[#461599]/15' 
                  : 'text-[#494453] hover:bg-[#f1f4f7]'
              }`}
            >
              <span className="material-symbols-outlined text-lg">science</span>
              <span>Reactor Químico</span>
            </button>

            {/* 🆕 QUÍMICA ORGÁNICA - NUEVO BOTÓN */}
            <button 
              onClick={() => setActiveTab('organica')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-xs font-bold transition-all ${
                activeTab === 'organica' 
                  ? 'bg-[#461599] text-white shadow-md shadow-[#461599]/15' 
                  : 'text-[#494453] hover:bg-[#f1f4f7]'
              }`}
            >
              <span className="material-symbols-outlined text-lg">science</span>
              <span>Química Orgánica</span>
            </button>

            <button 
              onClick={() => setActiveTab('quizzes')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-xs font-bold transition-all ${
                activeTab === 'quizzes' 
                  ? 'bg-[#461599] text-white shadow-md shadow-[#461599]/15' 
                  : 'text-[#494453] hover:bg-[#f1f4f7]'
              }`}
            >
              <span className="material-symbols-outlined text-lg">quiz</span>
              <span>Cuestionarios</span>
            </button>

            <button 
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-xs font-bold transition-all ${
                activeTab === 'profile' 
                  ? 'bg-[#461599] text-white shadow-md shadow-[#461599]/15' 
                  : 'text-[#494453] hover:bg-[#f1f4f7]'
              }`}
            >
              <span className="material-symbols-outlined text-lg">person</span>
              <span>Estudiante Perfil</span>
            </button>

            {/* ADMIN PANEL - Solo visible para admins */}
            {userRole === 'admin' && (
              <button 
                onClick={() => {
                  setActiveTab('admin');
                  loadAdminStats();
                  loadAdminUsers();
                  loadAdminActivities();
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-xs font-bold transition-all ${
                  activeTab === 'admin' 
                    ? 'bg-[#ba1a1a] text-white shadow-md shadow-[#ba1a1a]/15' 
                    : 'text-[#494453] hover:bg-[#f1f4f7]'
                }`}
              >
                <span className="material-symbols-outlined text-lg">admin_panel_settings</span>
                <span>Admin Panel</span>
                {adminStats?.pending_reports > 0 && (
                  <span className="ml-auto bg-[#ba1a1a] text-white text-[9px] font-black px-2 py-0.5 rounded-full">
                    {adminStats.pending_reports}
                  </span>
                )}
              </button>
            )}
          </nav>
        </div>

        <div className="pt-4 border-t border-[#cbc3d5]/30">
          <div className="flex items-center gap-3 p-1 mb-2">
            <div className="w-10 h-10 rounded-full bg-[#461599]/10 text-[#461599] font-black text-xs flex items-center justify-center">
              {userName[0]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-[#181c1e] truncate">{userName}</p>
              <p className="text-[10px] text-[#7b7484] font-medium capitalize">
                {userRole === 'admin' ? '👑 Administrador' : '🎓 Estudiante'}
              </p>
            </div>
          </div>
          <button 
            onClick={handleCustomLogout}
            className="w-full py-2.5 bg-[#f1f4f7] hover:bg-[#ffdad6] text-[#ba1a1a] hover:border-red-300 border border-[#cbc3d5]/30 rounded-xl text-[11px] font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut size={13} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* MOBILE PORT NAVIGATION */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#cbc3d5]/40 h-16 px-4 py-2 z-40 flex justify-around items-center">
        <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center flex-1 ${activeTab === 'dashboard' ? 'text-[#461599]' : 'text-[#7b7484]'}`}>
          <span className="material-symbols-outlined text-lg">dashboard</span>
          <span className="text-[9px] font-bold">Resumen</span>
        </button>
        <button onClick={() => setActiveTab('periodic')} className={`flex flex-col items-center flex-1 ${activeTab === 'periodic' ? 'text-[#461599]' : 'text-[#7b7484]'}`}>
          <span className="material-symbols-outlined text-lg">grid_view</span>
          <span className="text-[9px] font-bold">Tabla</span>
        </button>
        <button onClick={() => setActiveTab('simulator')} className={`flex flex-col items-center flex-1 ${activeTab === 'simulator' ? 'text-[#461599]' : 'text-[#7b7484]'}`}>
          <span className="material-symbols-outlined text-lg">science</span>
          <span className="text-[9px] font-bold">Reactor</span>
        </button>
        <button onClick={() => setActiveTab('organica')} className={`flex flex-col items-center flex-1 ${activeTab === 'organica' ? 'text-[#461599]' : 'text-[#7b7484]'}`}>
          <span className="material-symbols-outlined text-lg">science</span>
          <span className="text-[9px] font-bold">Orgánica</span>
        </button>
        <button onClick={() => setActiveTab('quizzes')} className={`flex flex-col items-center flex-1 ${activeTab === 'quizzes' ? 'text-[#461599]' : 'text-[#7b7484]'}`}>
          <span className="material-symbols-outlined text-lg">quiz</span>
          <span className="text-[9px] font-bold">Cuestionario</span>
        </button>
        {userRole === 'admin' && (
          <button onClick={() => {
            setActiveTab('admin');
            loadAdminStats();
            loadAdminUsers();
            loadAdminActivities();
          }} className={`flex flex-col items-center flex-1 ${activeTab === 'admin' ? 'text-[#ba1a1a]' : 'text-[#7b7484]'}`}>
            <span className="material-symbols-outlined text-lg">admin_panel_settings</span>
            <span className="text-[9px] font-bold">Admin</span>
          </button>
        )}
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 lg:ml-64 flex flex-col min-w-0 pb-20 lg:pb-0">
        
        <header className="sticky top-0 bg-white/80 backdrop-blur-md px-6 py-4 border-b border-[#cbc3d5]/30 flex justify-between items-center z-30">
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#461599] font-black uppercase tracking-wider bg-[#461599]/10 px-3 py-1 rounded-full">
              LAB-ON-AIR
            </span>
            <div className="hidden lg:block h-6 w-[1px] bg-[#cbc3d5]/50"></div>
            <p className="hidden lg:block text-xs text-[#7b7484] font-bold">
              {userName} • {userRole === 'admin' ? '👑 Administrador' : '🎓 Estudiante Premium'}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group hidden sm:block">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7b7484]">
                <Search size={15} />
              </span>
              <input 
                type="text" 
                placeholder="Buscar reactivos o lecciones..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-[#f1f4f7] border border-[#cbc3d5]/15 focus:border-[#461599] rounded-full text-xs font-semibold outline-none w-64 placeholder:text-[#7b7484]/70 transition-all focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-1">
              <button 
                onClick={() => showToast('Bandeja de entrada sin mensajes nuevos.')}
                className="w-9 h-9 flex items-center justify-center rounded-full text-[#494453] hover:bg-[#f1f4f7] relative transition-colors"
                title="Mensajes"
              >
                <Mail size={16} />
              </button>
              
              <button 
                onClick={() => {
                  showToast('Prueba virtual iniciada y en sincronía temporal.');
                }}
                className="w-9 h-9 flex items-center justify-center rounded-full text-[#494453] hover:bg-[#f1f4f7] relative transition-colors"
                title="Notificaciones"
              >
                <Bell size={16} />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#ba1a1a]"></span>
              </button>
            </div>
          </div>
        </header>

        <main className="p-6">
          
          {/* TAB: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-fade-in">
              <div className="bg-gradient-to-r from-[#461599] to-[#5e35b1] rounded-[2.25rem] p-8 md:p-10 text-white relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl shadow-[#461599]/10">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]"></div>
                
                <div className="space-y-3 max-w-lg relative z-10 text-center md:text-left">
                  <h2 className="text-3xl md:text-4xl font-black tracking-tight flex items-center justify-center md:justify-start gap-3">
                    ¡Hola, {userName}! 
                    <span className="animate-bounce">👋</span>
                  </h2>
                  <p className="text-[#ceb8ff] text-base font-semibold leading-relaxed">
                    ¿Te gustaría reanudar el reactor de equilibrio molecular? Las lecciones prácticas virtuales te aguardan.
                  </p>
                  <div className="pt-2 flex flex-wrap gap-2 justify-center md:justify-start">
                    <button 
                      onClick={() => setActiveTab('periodic')}
                      className="px-5 py-2.5 bg-[#fdd34d] hover:bg-[#ffe087] text-[#725b00] text-xs font-bold rounded-xl shadow-lg shadow-[#735c00]/15 transition-all"
                    >
                      Continuar Lección de Carbono
                    </button>
                    <button 
                      onClick={() => setActiveTab('simulator')}
                      className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-all"
                    >
                      Química de Reactores
                    </button>
                  </div>
                </div>

                <div className="relative w-44 h-44 shrink-0 flex items-center justify-center z-10">
                  <div className="absolute inset-0 bg-[#eaddff]/20 rounded-full blur-2xl"></div>
                  <div className="relative w-36 h-36 border border-white/20 bg-white/15 backdrop-blur-md rounded-[2.5rem] flex items-center justify-center shadow-xl">
                    <span className="material-symbols-outlined text-7xl text-[#fdd34d] animate-pulse filled">science</span>
                  </div>
                  <div className="absolute top-4 left-6 w-3 h-3 rounded-full bg-emerald-400 animate-ping"></div>
                  <div className="absolute bottom-6 right-8 w-2.5 h-2.5 rounded-full bg-[#ffb1c5]"></div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-base font-bold text-[#181c1e] tracking-tight px-1">Resumen del Curso en Curso</h3>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white hover:bg-[#f1f4f7]/30 border border-[#cbc3d5]/35 p-5 rounded-[1.75rem] flex items-center gap-4 shadow-sm hover:scale-[1.02] transition-all">
                    <div className="w-12 h-12 bg-[#ffe087] rounded-2xl flex items-center justify-center text-[#725b00]">
                      <Clock size={20} />
                    </div>
                    <div>
                      <p className="text-2xl font-black text-[#181c1e]">83%</p>
                      <p className="text-[10px] font-bold text-[#7b7484] uppercase tracking-wider">Módulos de Práctica</p>
                    </div>
                  </div>

                  <div className="bg-white hover:bg-[#f1f4f7]/30 border border-[#cbc3d5]/35 p-5 rounded-[1.75rem] flex items-center gap-4 shadow-sm hover:scale-[1.02] transition-all">
                    <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                      <CheckCircle size={20} />
                    </div>
                    <div>
                      <p className="text-2xl font-black text-[#181c1e]">50%</p>
                      <p className="text-[10px] font-bold text-[#7b7484] uppercase tracking-wider">Avance Práctico</p>
                    </div>
                  </div>

                  <div className="bg-white hover:bg-[#f1f4f7]/30 border border-[#cbc3d5]/35 p-5 rounded-[1.75rem] flex items-center gap-4 shadow-sm hover:scale-[1.02] transition-all">
                    <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-650">
                      <AlertTriangle size={20} />
                    </div>
                    <div>
                      <p className="text-2xl font-black text-[#181c1e]">70%</p>
                      <p className="text-[10px] font-bold text-[#7b7484] uppercase tracking-wider">Pruebas en Cola</p>
                    </div>
                  </div>

                  <div className="bg-white hover:bg-[#f1f4f7]/30 border border-[#cbc3d5]/35 p-5 rounded-[1.75rem] flex items-center gap-4 shadow-sm hover:scale-[1.02] transition-all">
                    <div className="w-12 h-12 bg-[#eaddff] rounded-2xl flex items-center justify-center text-[#461599]">
                      <Sparkles size={20} />
                    </div>
                    <div>
                      <p className="text-2xl font-black text-[#181c1e]">62%</p>
                      <p className="text-[10px] font-bold text-[#7b7484] uppercase tracking-wider">Tareas completadas</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <h3 className="text-base font-bold text-[#181c1e]">Módulos de Química Operativos</h3>
                  <button 
                    onClick={() => {
                      showToast('Explorador de módulos completos cargado.');
                    }}
                    className="text-xs text-[#461599] font-bold hover:underline"
                  >
                    Ver Todos los Módulos
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {courseModulesList.map((mod) => (
                    <div 
                      key={mod.id}
                      className="bg-white border border-[#cbc3d5]/35 rounded-[1.75rem] p-5 flex items-center justify-between hover:border-[#461599]/40 transition-all shadow-sm"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 ${mod.bgColor} rounded-2xl flex items-center justify-center text-[#461599] shrink-0`}>
                          <span className="material-symbols-outlined text-3xl font-bold">{mod.imageUrl}</span>
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-[#181c1e] line-clamp-1">{mod.title}</h4>
                          <div className="flex items-center gap-2">
                            <span className="bg-[#eaddff] text-[#24005b] text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full">
                              {mod.year}
                            </span>
                            <span className="text-[10px] text-[#7b7484] font-semibold">{mod.subject}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-bold ${mod.status === 'Iniciado' ? 'text-indigo-600' : mod.status === 'Listo' ? 'text-emerald-600' : 'text-amber-500'}`}>
                          {mod.status}
                        </span>
                        <button 
                          onClick={() => {
                            if (mod.id === 'mod1') setActiveTab('periodic');
                            else if (mod.id === 'mod2') setActiveTab('quizzes');
                            else {
                              setActiveTab('simulator');
                              handleSimulateCustomReaction();
                            }
                          }}
                          className="p-2 rounded-xl bg-[#f1f4f7] hover:bg-[#461599] hover:text-white text-[#461599] transition-all cursor-pointer"
                        >
                          <ChevronRight size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white/80 border border-[#cbc3d5]/35 rounded-[2rem] p-6 space-y-4">
                <div className="flex justify-between items-start flex-wrap gap-2">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-[#461599] uppercase tracking-wider flex items-center gap-2">
                      <Sparkles size={16} />
                      Motor Cognitivo de MyLab IA
                    </h3>
                    <p className="text-xs text-[#7b7484]">Analiza tu progreso en el simulador y recomienda nuevas prácticas de laboratorio en tiempo real.</p>
                  </div>
                  <button 
                    onClick={() => handleAiInsightGeneration('Habilidades Estantillonas de Química')}
                    disabled={loadingAiReport}
                    className="px-4 py-2 bg-[#461599] text-white text-xs font-bold rounded-xl hover:bg-[#5e35b1] transition-all flex items-center gap-1.5"
                  >
                    {loadingAiReport ? 'Generando análisis...' : 'Generar Recomendación Especial'}
                  </button>
                </div>

                {aiReportContent ? (
                  <div className="p-4 bg-[#f1f4f7] border-l-4 border-l-[#461599] rounded-r-2xl text-xs text-[#494453] leading-relaxed italic animate-fade-in whitespace-pre-wrap">
                    {aiReportContent}
                  </div>
                ) : (
                  <p className="text-xs text-[#7b7484] italic">Presiona el botón de arriba para consultar el diagnóstico automatizado de la lección corriente.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB: PERIODIC TABLE */}
          {activeTab === 'periodic' && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 animate-fade-in">
              <div className="xl:col-span-8 flex flex-col space-y-6">
                <div className="flex flex-wrap gap-2 bg-white/70 backdrop-blur border border-[#cbc3d5]/30 p-2 rounded-2xl">
                  {['Todos', 'No Metales', 'Metales Alcalinos', 'Gases Nobles', 'Halógenos', 'Metaloides', 'Metales de Transición'].map((cat) => (
                    <button 
                      key={cat}
                      onClick={() => setElementFilter(cat)}
                      className={`px-3.5 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                        elementFilter === cat 
                          ? 'bg-[#461599] text-white shadow' 
                          : 'text-[#494453] hover:bg-[#f1f4f7]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="bg-white border border-[#cbc3d5]/35 rounded-[2rem] p-6 space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-[#f1f4f7]">
                    <p className="text-xs font-bold text-[#181c1e]">Elementos Disponibles ({getFilteredElements().length})</p>
                    <span className="text-[10px] text-[#7b7484] font-medium italic">Fútbol Molecular &bull; Lab Estructuras</span>
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
                    {getFilteredElements().map((el) => {
                      const isSelected = selectedElement.symbol === el.symbol;
                      let catColor = '#461599';
                      if (el.category === 'No Metal') catColor = '#9fa8da';
                      if (el.category === 'Metales Alcalinos') catColor = '#ba1a1a';
                      if (el.category === 'Gases Nobles') catColor = '#760038';
                      if (el.category === 'Halógenos') catColor = '#735c00';
                      if (el.category === 'Metaloides') catColor = '#fdd34d';

                      return (
                        <div 
                          key={el.symbol}
                          onClick={() => {
                            setSelectedElement(el);
                            showToast(`Seleccionado: ${el.name} (${el.symbol})`);
                          }}
                          style={{ borderColor: isSelected ? '#461599' : `${catColor}35` }}
                          className={`bg-white hover:bg-[#f1f4f7]/20 border-l-4 rounded-xl p-3 text-center cursor-pointer hover:scale-[1.04] transition-all flex flex-col justify-between h-20 items-stretch ${
                            isSelected ? 'ring-2 ring-[#461599] bg-[#eaddff]/10' : 'border-slate-200 shadow-sm'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-bold text-[#7b7484] leading-none">{el.number}</span>
                            <span className="text-[8px] font-bold text-[#cbc3d5]">{el.mass}</span>
                          </div>
                          <p className="text-lg font-black text-[#181c1e] text-center leading-none">{el.symbol}</p>
                          <p className="text-[8px] font-bold text-[#7b7484] truncate uppercase leading-none">{el.name}</p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap gap-4 text-[10px] font-bold text-[#7b7484] pt-4 border-t border-[#f1f4f7]" id="category-legend">
                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#9fa8da]"></span> No Metales</div>
                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#ba1a1a]"></span> Alcalinos</div>
                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#760038]"></span> Gases Nobles</div>
                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#735c00]"></span> Halógenos</div>
                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#fdd34d]"></span> Metaloides</div>
                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#461599]"></span> Transición</div>
                  </div>
                </div>

                <div className="bg-[#f1f4f7] border border-[#cbc3d5]/35 rounded-[2.25rem] p-6 space-y-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-[#181c1e] flex items-center gap-2">
                      <Beaker size={16} className="text-[#461599]" />
                      Lanzador de Reactivos al Reactor Sincrónico
                    </h4>
                    <p className="text-xs text-[#7b7484]">Mezcla el elemento seleccionado en curso con un reactivo adicional rápido.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-[#494453] uppercase block mb-1">Reactivo Base (Elemento)</label>
                      <input 
                        type="text" 
                        readOnly 
                        value={`${selectedElement.name} (${selectedElement.symbol})`}
                        className="w-full px-4 py-2.5 rounded-xl border border-[#cbc3d5]/40 bg-white text-xs font-bold text-[#181c1e] outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#494453] uppercase block mb-1">Adicionar Segundo Reactivo</label>
                      <select 
                        value={reactant2} 
                        onChange={(e) => setReactant2(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-[#cbc3d5]/40 bg-white text-xs font-bold text-[#181c1e] outline-none cursor-pointer"
                      >
                        <option value="Agua">Agua (H2O)</option>
                        <option value="Oxígeno">Oxígeno (O2)</option>
                        <option value="Ácido Clorhídrico">Ácido Clorhídrico (HCl)</option>
                        <option value="Sodio">Sodio (Na)</option>
                        <option value="Ácido Sulfúrico">Ácido Sulfúrico (H2SO4)</option>
                        <option value="Potasio">Potasio (K)</option>
                      </select>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      setReactant1(selectedElement.name);
                      setActiveTab('simulator');
                      handleSimulateCustomReaction(`${selectedElement.name} y ${reactant2}`);
                    }}
                    className="px-5 py-2.5 bg-[#461599] hover:bg-[#5e35b1] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all w-full shadow shadow-[#461599]/15"
                  >
                    <span>Lanzar Simulación Química ({selectedElement.symbol} + {reactant2})</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              <div className="xl:col-span-4">
                <div className="bg-white border border-[#cbc3d5]/35 rounded-[2rem] p-6 space-y-6 sticky top-24">
                  <div className="text-center space-y-4">
                    <span className="text-[10px] uppercase font-bold px-3 py-1 bg-[#461599]/10 text-[#461599] rounded-full inline-block">
                      {selectedElement.category}
                    </span>
                    <h3 className="text-3xl font-extrabold text-[#181c1e] tracking-tight">{selectedElement.name}</h3>
                    
                    <div className="relative w-40 h-40 mx-auto flex items-center justify-center bg-[#f1f4f7]/40 rounded-full border border-[#cbc3d5]/15">
                      <div className="absolute inset-2 border border-dashed border-[#461599]/30 rounded-full animate-[spin_8s_linear_infinite]"></div>
                      <div className="absolute inset-6 border border-dashed border-[#735c00]/30 rounded-full animate-[spin_5s_linear_infinite_reverse]"></div>
                      <div className="absolute inset-10 border border-dashed border-[#760038]/30 rounded-full animate-[spin_3s_linear_infinite]"></div>
                      <div className="w-14 h-14 bg-[#461599] text-white font-extrabold text-xl rounded-full flex items-center justify-center shadow-lg">
                        {selectedElement.symbol}
                      </div>
                      <div className="absolute top-2 left-18 w-2 h-2 rounded-full bg-[#fdd34d]"></div>
                      <div className="absolute bottom-6 right-10 w-1.5 h-1.5 rounded-full bg-[#ba1a1a]"></div>
                    </div>
                  </div>

                  <div className="space-y-2 border-y border-[#f1f4f7] py-4 text-xs font-bold">
                    <div className="flex justify-between">
                      <span className="text-[#7b7484]">Número Atómico:</span>
                      <span className="text-[#181c1e]">{selectedElement.number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#7b7484]">Masa Atómica:</span>
                      <span className="text-[#181c1e]">{selectedElement.mass} u</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#7b7484]">Estado STP:</span>
                      <span className="text-[#181c1e]">{selectedElement.state}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#7b7484]">Punto de Fusión:</span>
                      <span className="text-[#181c1e]">{selectedElement.meltingPoint}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#7b7484]">Configuración:</span>
                      <span className="font-mono text-[#461599]">{selectedElement.config}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#7b7484]">Descubridor:</span>
                      <span className="text-[#181c1e]">{selectedElement.discovered}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-[#181c1e] uppercase">Resumen de Propiedades:</h4>
                    <p className="text-xs leading-relaxed text-[#494453]">{selectedElement.description}</p>
                  </div>

                  <div className="space-y-2 pt-2">
                    <button 
                      onClick={() => {
                        addElementToFlask(selectedElement.symbol);
                        showToast(`¡Inyectado ${selectedElement.symbol} al matraz virtual!`);
                      }}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow shadow-indigo-600/10 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <PlusCircle size={14} />
                      <span>Inyectar Átomo al Matraz</span>
                    </button>

                    <button 
                      onClick={() => {
                        setReactant1(selectedElement.name);
                        setReactant2('Agua');
                        setActiveTab('simulator');
                        handleSimulateCustomReaction(`${selectedElement.name} y Agua`);
                      }}
                      className="w-full py-2.5 bg-[#f1f4f7] hover:bg-[#eaddff] text-[#461599] text-xs font-bold rounded-xl transition-all cursor-pointer"
                    >
                      Simular Reacción con Agua
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: SIMULATOR */}
          {activeTab === 'simulator' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white border border-[#cbc3d5]/35 rounded-[2rem] p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
                <div className="space-y-2">
                  <h2 className="text-xl font-extrabold text-[#181c1e] flex items-center gap-2">
                    <span className="material-symbols-outlined text-2xl text-[#461599] filled">science</span>
                    MyLab Reactor Molecular Sincrónico
                  </h2>
                  <p className="text-xs text-[#494453] max-w-2xl">
                    Inyecta átomos de forma libre, regula la fuente de calor Bunsen, y observa cómo los sensores de telemetría y el balanceador algebraico estequiométrico reaccionan instantáneamente para cumplir las leyes físicas.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => setShowEstequiometriaModal(true)}
                    className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-[#461599] text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 border border-[#461599]/15"
                  >
                    <BookOpen size={14} />
                    Guía de Estequiometría
                  </button>
                  <button 
                    onClick={() => setShowSeguridadModal(true)}
                    className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-[#ba1a1a] text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 border border-[#ba1a1a]/15"
                  >
                    <ShieldAlert size={14} />
                    Protocolos de Seguridad
                  </button>
                  <button 
                    onClick={() => setShowHelpModal(true)}
                    className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-[#725b00] text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 border border-[#fdd34d]/25"
                  >
                    <HelpCircle size={14} />
                    Centro de Ayuda
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                {/* Columna 1 - Piscina de Elementos */}
                <div className="xl:col-span-4 flex flex-col space-y-6">
                  <div className="bg-white border border-[#cbc3d5]/35 rounded-[2rem] p-6 space-y-4 shadow-sm">
                    <div className="space-y-1">
                      <h3 className="text-xs font-black text-[#7b7484] uppercase tracking-wider block border-b border-[#f1f4f7] pb-2">
                        Piscina de Elementos (Pool)
                      </h3>
                      <p className="text-2xs text-[#7b7484]">Haz clic para inyectar reactivos directamente al matraz de MyLab.</p>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { symbol: 'H', name: 'Hidrógeno', color: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
                        { symbol: 'He', name: 'Helio', color: 'bg-rose-50 border-rose-200 text-rose-700' },
                        { symbol: 'O', name: 'Oxígeno', color: 'bg-blue-50 border-blue-200 text-blue-700' },
                        { symbol: 'C', name: 'Carbono', color: 'bg-slate-100 border-slate-300 text-slate-800' },
                        { symbol: 'Na', name: 'Sodio', color: 'bg-amber-100 border-amber-300 text-amber-800' },
                        { symbol: 'Cl', name: 'Cloro', color: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
                        { symbol: 'Fe', name: 'Hierro', color: 'bg-orange-50 border-orange-200 text-orange-800' },
                        { symbol: 'N', name: 'Nitrógeno', color: 'bg-violet-50 border-violet-200 text-violet-800' }
                      ].map(el => (
                        <button
                          key={el.symbol}
                          onClick={() => addElementToFlask(el.symbol)}
                          className={`flex flex-col items-center justify-center p-2.5 border rounded-xl hover:scale-105 active:scale-95 transition-all text-center cursor-pointer ${el.color}`}
                        >
                          <span className="text-sm font-black tracking-tight leading-none">{el.symbol}</span>
                          <span className="text-[8px] font-extrabold truncate w-full mt-0.5 leading-none">{el.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white border border-[#cbc3d5]/35 rounded-[2rem] p-6 space-y-4 shadow-sm flex-1">
                    <div className="flex justify-between items-center border-b border-[#f1f4f7] pb-3">
                      <h3 className="text-xs font-black text-[#181c1e] uppercase">
                        Contenido del Matraz
                      </h3>
                      {flaskElements.length > 0 && (
                        <button
                          onClick={clearFlask}
                          className="text-[10px] text-rose-650 hover:underline flex items-center gap-1 font-bold bg-transparent border-none cursor-pointer"
                        >
                          <Trash2 size={12} />
                          Limpiar
                        </button>
                      )}
                    </div>

                    {flaskElements.length === 0 ? (
                      <div className="py-10 text-center space-y-2">
                        <span className="material-symbols-outlined text-4xl text-[#cbc3d5] animate-pulse">science</span>
                        <p className="text-xs text-[#7b7484] italic">El matraz está vacío. Selecciona átomos arriba o de la Tabla Periódica para iniciar la reacción.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto p-1 bg-[#f1f4f7]/40 rounded-xl">
                          {flaskElements.map((sym, index) => {
                            let bgClass = 'bg-[#461599]/10 text-[#461599] border-[#461599]/20';
                            if (sym === 'H') bgClass = 'bg-blue-50 text-blue-700 border-blue-200';
                            if (sym === 'O') bgClass = 'bg-red-50 text-red-700 border-red-200';
                            if (sym === 'Na') bgClass = 'bg-amber-50 text-amber-700 border-amber-200';
                            if (sym === 'Cl') bgClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                            return (
                              <div
                                key={index}
                                className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border flex items-center gap-1 shrink-0 ${bgClass}`}
                              >
                                <span className="text-[8px] opacity-70 leading-none">#{index+1}</span>
                                <span>{sym}</span>
                              </div>
                            );
                          })}
                        </div>

                        <div className="bg-[#f1f4f7] rounded-2xl p-4 space-y-2 text-xs font-semibold">
                          <div className="flex justify-between">
                            <span className="text-[#7b7484]">Fórmula Empírica:</span>
                            <span className="text-[#461599] font-mono font-bold text-sm bg-[#eaddff]/40 px-2 py-0.5 rounded">
                              {empiricalFormula}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#7b7484]">Compuesto Resultante:</span>
                            <span className="text-[#181c1e] text-right font-bold truncate max-w-[150px]" title={empiricalResultName}>
                              {empiricalResultName}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#7b7484]">Clasificación Química:</span>
                            <span className="text-[#494453] bg-white border px-2 py-0.2 rounded-md text-[10px]" title={reactionType}>
                              {reactionType}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2 pt-2 border-t border-[#f1f4f7]">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-[#181c1e] flex items-center gap-1">
                          <span className="material-symbols-outlined text-[#ba1a1a] text-sm filled">local_fire_department</span>
                          Potenciómetro Quemador Bunsen:
                        </span>
                        <span className="text-rose-650 font-mono text-xs bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          {potentiometerHeat}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={potentiometerHeat}
                        onChange={(e) => setPotentiometerHeat(parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#461599]"
                      />
                      <span className="text-[10px] text-[#7b7484] block font-medium">Incrementa manualmente la energía calórica del sistema por conducción térmica.</span>
                    </div>
                  </div>
                </div>

                {/* Columna 2 - Matraz y Balanceador */}
                <div className="xl:col-span-4 flex flex-col space-y-6">
                  <div className="bg-white border border-[#cbc3d5]/35 rounded-[2rem] p-6 shadow-sm flex flex-col items-center justify-center relative min-h-[280px]">
                    <div className="absolute top-4 left-4 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full animate-ping" style={{ backgroundColor: liquidColor }}></span>
                      <span className="text-[10px] text-[#7b7484] font-black uppercase tracking-wider">Líquido de Matraz de MyLab</span>
                    </div>

                    <div className="relative w-40 h-48 flex items-center justify-center shrink-0 mt-4">
                      <div className="absolute bottom-0 w-32 h-36 border-[4px] border-[#cbc3d5] rounded-[3.5rem_3.5rem_2rem_2rem] bg-white/10 relative overflow-hidden flex flex-col justify-end items-center p-1.5 shadow-md">
                        <div className="absolute left-3 top-6 w-3 h-[1px] bg-[#cbc3d5]/50"></div>
                        <div className="absolute left-3 top-12 w-4 h-[1px] bg-[#cbc3d5]/50"></div>
                        <div className="absolute left-3 top-18 w-3 h-[1px] bg-[#cbc3d5]/50"></div>
                        <div className="absolute left-3 top-24 w-4 h-[1px] bg-[#cbc3d5]/50"></div>

                        <div 
                          style={{
                            backgroundColor: liquidColor,
                            height: flaskElements.length > 0 ? `${Math.min(92, 20 + flaskElements.length * 8)}%` : '0%'
                          }}
                          className="w-full rounded-b-[1.75rem] transition-all duration-[750ms] relative flex flex-col items-center justify-start overflow-hidden shadow-inner"
                        >
                          <div className="absolute top-0 left-0 right-0 h-2 bg-white/20 animate-pulse"></div>

                          {(reactionRate > 5 || potentiometerHeat > 5) && (
                            <div className="absolute inset-x-0 bottom-1 top-2 z-10 flex justify-around items-end overflow-hidden pb-2">
                              <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-[bounce_1.4s_infinite]" style={{ animationDelay: '100ms' }}></span>
                              <span className="w-2 h-2 bg-white/50 rounded-full animate-[bounce_1.1s_infinite]" style={{ animationDelay: '350ms' }}></span>
                              <span className="w-1 h-1 bg-white/30 rounded-full animate-[bounce_1.7s_infinite]" style={{ animationDelay: '0ms' }}></span>
                              <span className="w-2 h-2 bg-white/45 rounded-full animate-[bounce_1.3s_infinite]" style={{ animationDelay: '500ms' }}></span>
                              <span className="w-1.5 h-1.5 bg-white/35 rounded-full animate-[bounce_1.5s_infinite]" style={{ animationDelay: '200ms' }}></span>
                            </div>
                          )}

                          {reactionResult?.animationType === 'precipitation' && (
                            <div className="absolute bottom-0 inset-x-1 h-3.5 bg-gradient-to-t from-black/25 to-transparent rounded-full border-t border-white/20"></div>
                          )}
                        </div>
                      </div>

                      <div className="absolute bottom-36 w-6 h-10 border-x-[4px] border-[#cbc3d5] bg-white/10 z-0"></div>
                      <div className="absolute bottom-[176px] w-8 h-[6px] border-[3px] border-[#cbc3d5] bg-slate-300 rounded-full"></div>

                      {((flaskElements.length > 0 && reactionRate > 10) || potentiometerHeat > 10) && (
                        <div className="absolute top-[-18px] w-8 flex justify-center gap-1 z-20">
                          <span className="w-2 h-6 bg-[#cbc3d5]/30 rounded-full blur-xs animate-bounce" style={{ animationDelay: '0ms' }}></span>
                          <span className="w-2.5 h-8 bg-[#cbc3d5]/20 rounded-full blur-xs animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                      )}

                      {reactionRate > 65 && (
                        <div className="absolute top-12 right-2 bg-rose-600 text-white p-1.5 rounded-full shadow-lg animate-ping">
                          <span className="material-symbols-outlined text-xs">local_fire_department</span>
                        </div>
                      )}
                    </div>

                    {flaskElements.length > 0 && reactionResult && (
                      <div className="text-center mt-3 px-4 space-y-1">
                        <p className="text-xs font-bold text-[#181c1e] line-clamp-2">{reactionResult.visuals}</p>
                        <p className="text-[10px] text-amber-700 font-extrabold italic">{reactionResult.warning}</p>
                      </div>
                    )}
                  </div>

                  <div className="bg-white border border-[#cbc3d5]/35 rounded-[2rem] p-6 space-y-4 shadow-sm">
                    <div className="border-b border-[#f1f4f7] pb-3 flex justify-between items-center">
                      <div className="space-y-0.5">
                        <h3 className="text-xs font-black text-[#181c1e] uppercase">
                          Balanceador Estequiométrico
                        </h3>
                        <p className="text-[10px] text-[#7b7484] font-medium leading-none">Comprobación exacta de la Conservación de Masa</p>
                      </div>
                      <div className="w-6 h-6 bg-[#eaddff] text-[#461599] rounded-lg flex items-center justify-center font-mono text-[9px] font-black" title="Suma algebraica de masas moleculares">
                        Σ
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-[10px] font-bold text-[#7b7484] uppercase block mb-1">Ecuación Química Balanceada:</p>
                        <div className="px-4 py-2 bg-slate-900 border border-slate-700 text-emerald-400 font-mono text-xs font-black rounded-lg text-center shadow-inner tracking-wider">
                          {flaskElements.length === 0 ? '---' : computedBalancedEquation || 'Skeletal Balance'}
                        </div>
                      </div>

                      {flaskElements.length > 0 && (
                        <div className="space-y-2 text-2xs font-bold bg-[#f1f4f7]/70 p-3.5 rounded-xl border">
                          <p className="text-xs text-[#181c1e] border-b pb-1 font-black">Masas Molares del Sistema:</p>
                          <div className="space-y-1 mt-1 font-mono">
                            {reactantsListWeights.map((w, i) => (
                              <div key={i} className="flex justify-between items-center">
                                <span className="text-[#494453]">{w.formula}:</span>
                                <span className="text-[#181c1e]">{w.molarMass.toFixed(3)} g/mol</span>
                              </div>
                            ))}
                          </div>
                          
                          <div className="flex justify-between items-center text-xs pt-1.5 border-t border-slate-350 mt-1.5">
                            <span className="text-[#181c1e] font-black">Diferencia Neta Reactivos/Productos:</span>
                            <span className={`px-2 py-0.5 rounded font-bold ${isConservationValid ? 'bg-emerald-100 text-emerald-800' : 'bg-[#ffdad6] text-[#ba1a1a]'}`}>
                              {conservationDiff.toFixed(3)} g/mol
                            </span>
                          </div>

                          <div className="flex gap-1 items-center justify-center text-emerald-700 font-medium pt-1 text-[9px]">
                            {isConservationValid ? (
                              <>
                                <CheckCircle size={10} className="text-emerald-500" />
                                <span>Ley de Lavoisier validada: Peso conservado íntegramente.</span>
                              </>
                            ) : (
                              <span>Diferencia molecular detectada preliminarmente.</span>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-[#7b7484] uppercase tracking-wider block">Presets de Reacciones Históricas:</label>
                        <div className="grid grid-cols-2 gap-1.5">
                          {[
                            { name: 'Agua (Síntesis)', req: ['H', 'H', 'O'] },
                            { name: 'Herrumbre (Fierro)', req: ['Fe', 'Fe', 'O', 'O', 'O'] },
                            { name: 'Neutralización', req: ['H', 'Cl', 'Na', 'O', 'H'] },
                            { name: 'Haber-Bosch', req: ['N', 'N', 'H', 'H', 'H', 'H', 'H', 'H'] }
                          ].map(pre => (
                            <button
                              key={pre.name}
                              onClick={() => {
                                setFlaskElements(pre.req);
                                showToast(`Compuesto rápida cargado: ${pre.name}`);
                              }}
                              className="px-2.5 py-1.5 bg-indigo-50/50 hover:bg-indigo-100 border text-[#181c1e] text-[9px] font-bold rounded-lg truncate transition-all text-left cursor-pointer"
                            >
                              🔑 {pre.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Columna 3 - Telemetría */}
                <div className="xl:col-span-4 flex flex-col space-y-6">
                  <div className="bg-white border border-[#cbc3d5]/35 rounded-[2rem] p-6 space-y-5 shadow-sm">
                    <h3 className="text-xs font-black text-[#7b7484] uppercase tracking-wider border-b border-[#f1f4f7] pb-3">
                      Gabinete de Telemetría Escolar
                    </h3>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-[#f1f4f7]/70 border rounded-2xl p-3 flex flex-col justify-between items-center text-center">
                        <span className="material-symbols-outlined text-rose-600 text-lg">thermostat</span>
                        <div className="my-1.5">
                          <p className="text-sm font-black text-[#181c1e] font-mono leading-none">{temperature}°C</p>
                          <p className="text-[8px] font-extrabold text-[#7b7484] uppercase tracking-widest mt-0.5">Temp.</p>
                        </div>
                        <span className="text-[8px] bg-rose-50 text-rose-700 px-1.5 py-0.2 rounded font-extrabold truncate w-full">
                          {temperature > 70 ? 'Efervescente' : 'Estable'}
                        </span>
                      </div>

                      <div className="bg-[#f1f4f7]/70 border rounded-2xl p-3 flex flex-col justify-between items-center text-center">
                        <span className="material-symbols-outlined text-emerald-600 text-lg">colorize</span>
                        <div className="my-1.5">
                          <p className="text-sm font-black text-[#181c1e] font-mono leading-none">{pH}</p>
                          <p className="text-[8px] font-extrabold text-[#7b7484] uppercase tracking-widest mt-0.5">Nivel pH</p>
                        </div>
                        <span 
                          style={{
                            backgroundColor: pH < 3 ? '#ffe4e6' : pH > 11 ? '#f3e8ff' : '#dcfce7',
                            color: pH < 3 ? '#991b1b' : pH > 11 ? '#6b21a8' : '#166534'
                          }}
                          className="text-[8px] px-1.5 py-0.2 rounded font-extrabold truncate w-full"
                        >
                          {pH < 4 ? 'Ácido Fuerte' : pH > 10 ? 'Base Fuerte' : 'Intermedia'}
                        </span>
                      </div>

                      <div className="bg-[#f1f4f7]/70 border rounded-2xl p-3 flex flex-col justify-between items-center text-center">
                        <span className="material-symbols-outlined text-amber-600 text-lg">speed</span>
                        <div className="my-1.5">
                          <p className="text-sm font-black text-[#181c1e] font-mono leading-none">{reactionRate}%</p>
                          <p className="text-[8px] font-extrabold text-[#7b7484] uppercase tracking-widest mt-0.5">Reactivad</p>
                        </div>
                        <span className="text-[8px] bg-amber-50 text-amber-700 px-1.5 py-0.2 rounded font-extrabold truncate w-full">
                          {reactionRate > 50 ? 'Violento' : 'Pasivo'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-[#cbc3d5]/35 rounded-[2rem] p-6 space-y-4 shadow-sm flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-black text-[#181c1e] uppercase">Sondeo Histórico de Osciloscopio</h4>
                      <p className="text-2xs text-[#7b7484] mt-0.5">Graficador continuo en línea de las constantes de MyLab en directo.</p>
                    </div>

                    <div className="w-full h-48 bg-slate-900 rounded-2xl border border-slate-800 relative p-2 flex flex-col justify-center items-center">
                      {flaskElements.length === 0 ? (
                        <div className="text-center space-y-1">
                          <p className="text-2xs text-[#7b7484] font-bold">Sin señal activa.</p>
                          <p className="text-[8px] text-[#cbc3d5] tracking-wide">Agrega reactivos para encender el sensor.</p>
                        </div>
                      ) : (
                        <div className="w-full h-full text-[9px] font-mono">
                          <ResponsiveContainer width="99%" height="100%">
                            <LineChart data={telemetryHistory} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                              <XAxis dataKey="time" stroke="#64748b" tickSize={4} />
                              <YAxis stroke="#64748b" />
                              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }} />
                              <Line type="monotone" dataKey="Temp" stroke="#ef4444" strokeWidth={2} name="Temp (°C)" dot={false} activeDot={{ r: 4 }} />
                              <Line type="monotone" dataKey="pH" stroke="#10b981" strokeWidth={2} name="pH" dot={false} activeDot={{ r: 4 }} />
                              <Line type="monotone" dataKey="Reactividad" stroke="#f59e0b" strokeWidth={2} name="Reac (%)" dot={false} activeDot={{ r: 4 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>

                    <div className="text-3xs text-slate-400 leading-normal flex gap-1 items-center bg-[#181c1e] text-white p-3.5 rounded-xl border border-white/5 font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                      <span>Enlace asincrónico directo con los amortiguadores del reactor de MyLab.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 🆕 TAB: QUÍMICA ORGÁNICA */}
          {activeTab === 'organica' && (
            <OrganicChemistry onToast={showToast} />
          )}

          {/* TAB: QUIZZES */}
          {activeTab === 'quizzes' && (
            <div className="space-y-6 animate-fade-in">
              {!quizStarted && !quizTerminated ? (
                <div className="bg-white border border-[#cbc3d5]/35 rounded-[2rem] p-8 max-w-2xl mx-auto text-center space-y-6 shadow-sm">
                  <div className="w-16 h-16 bg-[#eaddff] text-[#461599] rounded-2xl flex items-center justify-center mx-auto shadow-md">
                    <span className="material-symbols-outlined text-3xl">school</span>
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-extrabold text-[#181c1e]">Cuestionario de Certificación en Química Virtual</h2>
                    <p className="text-xs text-[#494453] max-w-md mx-auto">
                      Ponte a prueba con este examen interactivo de 5 preguntas sobre estequiometría, escala de pH y protocolos de seguridad en el reactor de MyLab. Supera el test con al menos 3 preguntas correctas para obtener tu certificado virtual de competencia.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-left">
                    <div className="p-3 bg-[#f1f4f7] rounded-xl text-center space-y-1">
                      <p className="text-xs font-black text-[#181c1e]">5</p>
                      <p className="text-[10px] text-[#7b7484] font-semibold">Preguntas Totales</p>
                    </div>
                    <div className="p-3 bg-[#f1f4f7] rounded-xl text-center space-y-1">
                      <p className="text-xs font-black text-[#181c1e]">60%</p>
                      <p className="text-[10px] text-[#7b7484] font-semibold">Para Aprobar</p>
                    </div>
                    <div className="p-3 bg-[#f1f4f7] rounded-xl text-center space-y-1">
                      <p className="text-xs font-black text-[#181c1e]">Ilimitados</p>
                      <p className="text-[10px] text-[#7b7484] font-semibold">Intentos Autónomos</p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setQuizStarted(true);
                      setQuizTerminated(false);
                      setCurrQuestionIndex(0);
                      setQuizPoints(0);
                      setQuizSelectedAnswer(null);
                      setQuizAnswerSubmitted(false);
                      setTimeRemaining(300);
                    }}
                    className="px-8 py-3 bg-[#461599] hover:bg-[#5e35b1] text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-[#461599]/25 cursor-pointer block mx-auto w-full sm:w-auto"
                  >
                    Iniciar Examen de Autoevaluación
                  </button>
                </div>
              ) : quizStarted && !quizTerminated ? (
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                  <div className="xl:col-span-8 flex flex-col space-y-6">
                    <div className="bg-white border border-[#cbc3d5]/35 rounded-[2rem] p-6 flex flex-wrap justify-between items-center gap-4">
                      <div className="space-y-1">
                        <p className="text-[10px] font-extrabold text-[#7b7484] uppercase tracking-wider">CUESTIONARIO DE COMPETENCIA ACTIVO</p>
                        <h3 className="text-lg font-bold text-[#181c1e]">Pregunta {currQuestionIndex + 1} de 5</h3>
                      </div>

                      <div className="flex items-center gap-2 px-3.5 py-1.5 bg-[#ffdad6] text-[#ba1a1a] rounded-xl text-xs font-bold font-mono">
                        <Clock size={14} className="animate-pulse" />
                        <span>Tiempo Restante: {formattedTime()}</span>
                      </div>
                    </div>

                    <div className="w-full bg-[#cbc3d5]/40 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-[#461599] h-full rounded-full transition-all duration-500" 
                        style={{ width: `${((currQuestionIndex + 1) / 5) * 100}%` }}
                      ></div>
                    </div>

                    <div className="bg-white border border-[#cbc3d5]/35 rounded-[2rem] p-6 md:p-8 space-y-6">
                      <div className="space-y-2">
                        <span className="text-[9px] font-black uppercase px-2.5 py-0.5 bg-[#461599]/10 text-[#461599] rounded">
                          Autogestión Estudiantil
                        </span>
                        <h3 className="text-lg font-bold text-[#181c1e] leading-relaxed">
                          {CHEMISTRY_QUIZ_QUESTIONS[currQuestionIndex].question}
                        </h3>
                      </div>

                      <div className="space-y-3">
                        {CHEMISTRY_QUIZ_QUESTIONS[currQuestionIndex].options.map((option) => {
                          const isSelected = quizSelectedAnswer === option.key;
                          
                          return (
                            <button
                              key={option.key}
                              disabled={quizAnswerSubmitted}
                              onClick={() => setQuizSelectedAnswer(option.key)}
                              className={`w-full p-4 rounded-2xl border text-left flex items-start gap-4 transition-all cursor-pointer ${
                                isSelected 
                                  ? 'bg-[#ffe087]/20 border-[#fdd34d] shadow-sm' 
                                  : 'bg-white border-[#cbc3d5]/40 hover:bg-[#f1f4f7]/40 disabled:opacity-75'
                              }`}
                            >
                              <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                                isSelected ? 'bg-[#fdd34d] text-[#725b00]' : 'bg-[#f1f4f7] text-[#494453]'
                              }`}>
                                {option.key}
                              </span>
                              
                              <div className="flex-1 space-y-0.5">
                                <p className="text-sm font-bold text-[#181c1e]">{option.text}</p>
                              </div>

                              {isSelected && (
                                <Check size={16} className="text-[#735c00] shrink-0 self-center" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {quizAnswerSubmitted && (
                        <div className={`p-4 rounded-xl text-xs font-semibold leading-relaxed border ${
                          quizSelectedAnswer === CHEMISTRY_QUIZ_QUESTIONS[currQuestionIndex].options.find(o => o.correct)?.key
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : 'bg-rose-50 border-rose-200 text-[#ba1a1a]'
                        }`}>
                          {quizSelectedAnswer === CHEMISTRY_QUIZ_QUESTIONS[currQuestionIndex].options.find(o => o.correct)?.key ? (
                            <p className="flex items-center gap-1.5">
                              <CheckCircle size={14} className="text-emerald-600 shrink-0" />
                              <span>¡Exacto! {CHEMISTRY_QUIZ_QUESTIONS[currQuestionIndex].explanation}</span>
                            </p>
                          ) : (
                            <p className="flex items-center gap-1.5">
                              <AlertCircle size={14} className="text-rose-605 shrink-0" />
                              <span>Respuesta errónea. {CHEMISTRY_QUIZ_QUESTIONS[currQuestionIndex].explanation}</span>
                            </p>
                          )}
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-2 border-t border-[#f1f4f7]">
                        <button
                          onClick={() => {
                            if (currQuestionIndex > 0) {
                              setCurrQuestionIndex(prev => prev - 1);
                              setQuizSelectedAnswer(null);
                              setQuizAnswerSubmitted(false);
                            }
                          }}
                          disabled={currQuestionIndex === 0}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-[#494453] rounded-xl transition-all disabled:opacity-40 cursor-pointer"
                        >
                          Anterior
                        </button>

                        <div className="flex gap-2">
                          {!quizAnswerSubmitted ? (
                            <button
                              onClick={() => {
                                if (!quizSelectedAnswer) {
                                  showToast('Por favor selecciona una alternativa antes de enviar.');
                                  return;
                                }
                                setQuizAnswerSubmitted(true);
                                const correctOpt = CHEMISTRY_QUIZ_QUESTIONS[currQuestionIndex].options.find(o => o.correct)?.key;
                                if (quizSelectedAnswer === correctOpt) {
                                  setQuizPoints(prev => prev + 1);
                                  showToast('¡Respuesta guardada con éxito (+1 punto)!');
                                } else {
                                  showToast('Respuesta enviada.');
                                }
                              }}
                              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow"
                            >
                              Enviar Respuesta
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                if (currQuestionIndex < 4) {
                                  setCurrQuestionIndex(prev => prev + 1);
                                  setQuizSelectedAnswer(null);
                                  setQuizAnswerSubmitted(false);
                                } else {
                                  const randomHash = Math.floor(100000 + Math.random() * 900000);
                                  const code = `MYL-CERT-${randomHash}`;
                                  setValidationCode(code);
                                  
                                  const passed = quizPoints >= 3;
                                  saveQuizResult(quizPoints, 5, passed, code);
                                  
                                  setQuizTerminated(true);
                                  setQuizStarted(false);
                                  showToast('Prueba finalizada de forma exitosa.');
                                }
                              }}
                              className="px-6 py-2.5 bg-[#461599] hover:bg-[#5e35b1] text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow flex items-center gap-1"
                            >
                              <span>{currQuestionIndex === 4 ? 'Ver Resultados Finales' : 'Siguiente Pregunta'}</span>
                              <ChevronRight size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="xl:col-span-4 space-y-6">
                    <div className="bg-white border border-[#cbc3d5]/35 rounded-[2rem] p-6 text-center space-y-5 shadow-sm">
                      <h4 className="text-xs font-black text-[#7b7484] uppercase tracking-wider">Tu Puntuación en Curso</h4>
                      
                      <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
                        <div className="absolute inset-0 border-4 border-[#cbc3d5]/20 rounded-full"></div>
                        <div 
                          className="absolute inset-0 border-4 border-emerald-500 rounded-full transition-all duration-700"
                          style={{ clipPath: `polygon(0 0, 100% 0, 100% ${((currQuestionIndex) / 5) * 100}%, 0 ${((currQuestionIndex) / 5) * 100}%)` }}
                        ></div>

                        <div>
                          <p className="text-3xl font-black text-[#461599]">{quizPoints}</p>
                          <p className="text-[10px] text-[#7b7484] font-bold">aciertos acumulados</p>
                        </div>
                      </div>

                      <div className="p-4 bg-slate-50 rounded-2xl border text-left text-2xs space-y-1.5 font-semibold text-[#494453]">
                        <p className="font-extrabold text-[#181c1e] text-[10px]">TIPS DE AYUDA:</p>
                        <p>&bull; Relación de moles H₂:O₂ es de 2:1.</p>
                        <p>&bull; El pH es logarítmico; menor indica mayor concentración ácida H+.</p>
                        <p>&bull; La ley de Lavoisier prohíbe la pérdida espontánea de átomos.</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="max-w-3xl mx-auto space-y-6">
                  <div className="bg-white border border-[#cbc3d5]/35 rounded-[2rem] p-6 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left shadow-sm">
                    <div className="space-y-1">
                      <span className="text-[9px] uppercase font-black px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                        Examen Terminado
                      </span>
                      <h3 className="text-xl font-bold text-[#181c1e]">¡Estudio Finalizado con Éxito!</h3>
                      <p className="text-xs text-[#7b7484]">Has concluido la autoevaluación adaptativa de estequiometría de MyLab.</p>
                    </div>

                    <div className="p-4 bg-[#f1f4f7] rounded-2xl text-center min-w-[140px] border">
                      <p className="text-2xl font-black text-[#461599] font-mono leading-none">{quizPoints} / 5</p>
                      <p className="text-[9px] text-[#7b7484] uppercase font-bold mt-1">Calificación Estudiantil</p>
                    </div>
                  </div>

                  {quizPoints >= 3 ? (
                    <div className="bg-white border-8 border-[#461599] rounded-[2rem] p-8 md:p-12 relative overflow-hidden shadow-xl space-y-8 select-none">
                      <div className="absolute top-[-40px] right-[-45px] w-48 h-48 bg-[#461599]/5 rounded-full border-4 border-dashed border-[#461599]/10 rotate-45 pointer-events-none"></div>
                      <div className="absolute bottom-[-30px] left-[-30px] w-40 h-40 bg-[#ba1a1a]/5 rounded-full pointer-events-none"></div>

                      <div className="flex flex-col md:flex-row justify-between items-center border-b border-indigo-100 pb-6 gap-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 bg-[#461599] rounded-xl flex items-center justify-center text-white">
                            <span className="material-symbols-outlined text-lg filled">school</span>
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-[#461599] tracking-wider leading-none">MYLAB ACADEMY</h4>
                            <p className="text-[8px] text-[#7b7484] uppercase font-bold tracking-widest mt-0.5">Sistemas de Educación Autónoma</p>
                          </div>
                        </div>

                        <div className="px-4 py-2 bg-[#ffe087]/35 text-[#725b00] border border-[#fdd34d]/60 rounded-xl text-[10px] font-black tracking-widest font-mono">
                          REGISTRO VALIDADOR PREMIUM
                        </div>
                      </div>

                      <div className="text-center space-y-6">
                        <h2 className="text-xs font-black uppercase text-[#7b7484] tracking-[0.25em]">CERTIFICADO DE COMPETENCIA VIRTUAL</h2>
                        
                        <div className="space-y-1">
                          <p className="text-xs text-[#494453] italic">Este documento certifica con fe de hechos académicos virtuales que:</p>
                          <p className="text-2xl font-serif font-black text-[#181c1e] my-3 underline decoration-[#fdd34d] decoration-4 underline-offset-8">
                            {userName}
                          </p>
                        </div>

                        <p className="text-xs leading-relaxed max-w-lg mx-auto text-[#494453]">
                          Ha completado de forma autónoma y satisfactoria todas las fases del módulo adaptativo de <strong>Estequiometría de Enlace, Cálculo Diferencial de pH Cationes y Protocolos de Seguridad Escolar en Instalaciones de Riesgo</strong>, aprobando con un récord verificable de <span className="text-[#461599] font-black">{quizPoints*20}% de aciertos</span> en la plataforma interactiva de simulación de MyLab.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 pt-8 border-t border-indigo-50 gap-6 text-center text-xs">
                        <div className="space-y-1">
                          <p className="font-mono text-[9px] text-[#7b7484]">Firma del Director de Instrucción Virtual</p>
                          <p className="font-serif italic font-extrabold text-sm text-[#461599]">Prof. Robótica Educativa Sincrona</p>
                          <div className="w-32 h-[1px] bg-[#cbc3d5]/50 mx-auto mt-2"></div>
                          <p className="text-[8px] text-[#7b7484]">Sistema de IA MyLab v3.5</p>
                        </div>

                        <div className="space-y-1 flex flex-col justify-center items-center">
                          <p className="font-mono text-[9px] text-[#7b7484] uppercase">Código de Autogobierno Académico</p>
                          <p className="bg-slate-100 border px-3 py-1 text-[11px] font-bold text-slate-700 font-mono rounded tracking-widest">
                            {validationCode}
                          </p>
                          <p className="text-[8px] text-[#7b7484] mt-0.5">Generado y guardado en sesión de localStorage</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-rose-50 border border-rose-200 rounded-[2rem] p-6 text-center space-y-3">
                      <span className="material-symbols-outlined text-4xl text-rose-500 animate-pulse">heart_broken</span>
                      <h3 className="text-base font-bold text-[#ba1a1a]">Certificado Retenido</h3>
                      <p className="text-xs text-[#7b7484] max-w-sm mx-auto">
                        Para liberar tu diploma escolar necesitas completar la prueba con al menos 3 aciertos (60%). ¡Cuentas con intentos ilimitados libres! Vuelve a ensayar y equilibra el matraz.
                      </p>
                    </div>
                  )}

                  <div className="text-center pt-2">
                    <button
                      onClick={() => {
                        setQuizStarted(false);
                        setQuizTerminated(false);
                        setQuizPoints(0);
                        setQuizSelectedAnswer(null);
                        setQuizAnswerSubmitted(false);
                      }}
                      className="px-6 py-2.5 bg-[#461599] hover:bg-[#5e35b1] text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow"
                    >
                      Volver a Panel de Cuestionarios
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: PROFILE */}
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white border border-[#cbc3d5]/35 rounded-[2.5rem] p-6 md:p-8 flex flex-col md:flex-row gap-8 items-center">
                <div className="relative shrink-0">
                  <div className="absolute -inset-1 bg-[#461599] rounded-full blur-xs animate-pulse"></div>
                  <div className="relative w-28 h-28 rounded-full bg-[#f1f4f7] border-4 border-white flex items-center justify-center font-black text-[#461599] text-3xl shadow">
                    {userName[0]}
                  </div>
                  <span className="absolute bottom-1 right-1 w-6 h-6 bg-[#fdd34d] border-2 border-white rounded-full flex items-center justify-center text-on-secondary-container" title="Premium">
                    <Award size={12} />
                  </span>
                </div>

                <div className="space-y-3 flex-1 text-center md:text-left">
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-black px-2.5 py-0.5 bg-[#461599]/10 text-[#461599] rounded-full">
                      {userRole === 'admin' ? '👑 Administrador del Sistema' : '🎓 Estudiante de Química Premium'}
                    </span>
                    <h2 className="text-2xl font-black text-[#181c1e] tracking-tight">{userName}</h2>
                    <p className="text-xs text-[#7b7484] font-medium">Matrícula Escolar: <span className="font-bold text-[#181c1e]">MYL-998241</span> &bull; Miembro desde Sept 2023</p>
                  </div>

                  <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                    <span className="bg-[#ffe087] text-[#725b00] text-[10px] font-bold px-3 py-1 rounded-xl">
                      Puntos de Honor: 2,450 XP
                    </span>
                    <span className="bg-[#ffd9e1] text-[#760038] text-[10px] font-bold px-3 py-1 rounded-xl">
                      Nivel Técnico: 14
                    </span>
                    {userRole === 'admin' && (
                      <span className="bg-[#ba1a1a]/10 text-[#ba1a1a] text-[10px] font-bold px-3 py-1 rounded-xl">
                        👑 Administrador
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-[#f1f4f7] p-4 rounded-2xl space-y-1.5 text-center min-w-[150px]">
                  <p className="text-[10px] font-bold text-[#7b7484] uppercase">Habilitar Alertas</p>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-9 h-5 bg-[#cbc3d5] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#461599]"></div>
                  </label>
                  <p className="text-[9px] text-[#7b7484] font-medium">Mails semanales</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-[#cbc3d5]/35 rounded-[2rem] p-6 space-y-3">
                  <p className="text-xs font-black text-[#7b7484] uppercase">Cursos Recomendados para Alex</p>
                  <h4 className="text-sm font-bold text-[#181c1e]">Introducción a Cinética Química y Redox</h4>
                  <div className="w-full bg-[#f1f4f7] rounded-xl p-3 text-2xs text-[#494453] leading-relaxed">
                    Aprovecha tus habilidades en estequiometría avanzada para adentrarte en la velocidad de las reacciones y reactivos límite.
                  </div>
                </div>

                <div className="bg-white border border-[#cbc3d5]/35 rounded-[2rem] p-6 space-y-3">
                  <p className="text-xs font-black text-[#7b7484] uppercase">Tu Mayor Fortalecimiento</p>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-green-500">verified</span>
                    <h4 className="text-sm font-bold text-[#181c1e]">Gases y No Metales</h4>
                  </div>
                  <p className="text-xs text-[#494453] leading-relaxed">
                    Has completado 4 exámenes de gases ideales y compuestos inertes con una calificación idónea superior al 94%.
                  </p>
                </div>

                <div className="bg-white border border-[#cbc3d5]/35 rounded-[2rem] p-6 space-y-3">
                  <p className="text-xs font-black text-[#7b7484] uppercase">Tu Compañero Práctico</p>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#eaddff] text-xs font-bold flex items-center justify-center">MR</div>
                    <div>
                      <p className="text-xs font-bold text-[#181c1e]">Mateo Rico</p>
                      <p className="text-[10px] text-emerald-600 font-bold">Activo en reactor</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 🆕 TAB: ADMIN PANEL */}
          {activeTab === 'admin' && userRole === 'admin' && (
            <div className="space-y-6 animate-fade-in">
              
              <div className="bg-gradient-to-r from-[#ba1a1a] to-[#dc2626] rounded-[2.25rem] p-6 md:p-8 text-white shadow-xl">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
                      <span className="material-symbols-outlined text-3xl">admin_panel_settings</span>
                      Panel de Administración
                    </h2>
                    <p className="text-white/80 text-sm mt-1">
                      Gestiona usuarios, monitorea actividades y revisa estadísticas del sistema
                    </p>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl">
                    <span className="text-xs font-bold">👑 {userName}</span>
                    <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">Admin</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border border-[#cbc3d5]/35 rounded-[1.75rem] p-5 shadow-sm">
                  <p className="text-xs font-bold text-[#7b7484] uppercase">Total Usuarios</p>
                  <p className="text-2xl font-black text-[#181c1e]">{adminStats?.total_users || 0}</p>
                  <div className="flex gap-2 text-[10px] font-bold mt-1">
                    <span className="text-emerald-600">👨‍🎓 {adminStats?.total_students || 0}</span>
                    <span className="text-[#ba1a1a]">👑 {adminStats?.total_admins || 0}</span>
                  </div>
                </div>

                <div className="bg-white border border-[#cbc3d5]/35 rounded-[1.75rem] p-5 shadow-sm">
                  <p className="text-xs font-bold text-[#7b7484] uppercase">Simulaciones</p>
                  <p className="text-2xl font-black text-[#181c1e]">{adminStats?.total_simulations || 0}</p>
                  <span className="text-[10px] text-[#461599] font-bold">Laboratorios realizados</span>
                </div>

                <div className="bg-white border border-[#cbc3d5]/35 rounded-[1.75rem] p-5 shadow-sm">
                  <p className="text-xs font-bold text-[#7b7484] uppercase">Cuestionarios</p>
                  <p className="text-2xl font-black text-[#181c1e]">{adminStats?.total_quizzes || 0}</p>
                  <span className="text-[10px] text-emerald-600 font-bold">Exámenes completados</span>
                </div>

                <div className="bg-white border border-[#cbc3d5]/35 rounded-[1.75rem] p-5 shadow-sm">
                  <p className="text-xs font-bold text-[#7b7484] uppercase">Reportes Pendientes</p>
                  <p className="text-2xl font-black text-[#ba1a1a]">{adminStats?.pending_reports || 0}</p>
                  <span className="text-[10px] text-[#ba1a1a] font-bold">Requieren revisión</span>
                </div>
              </div>

              <div className="bg-white border border-[#cbc3d5]/35 rounded-[2rem] p-6 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-[#181c1e] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#461599] text-lg">groups</span>
                    Usuarios del Sistema
                  </h3>
                  <button 
                    onClick={() => {
                      loadAdminUsers();
                      showToast('Lista de usuarios actualizada');
                    }}
                    className="text-xs text-[#461599] font-bold hover:underline"
                  >
                    Actualizar
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#f1f4f7] text-left text-[10px] font-bold text-[#7b7484] uppercase">
                        <th className="pb-2">Usuario</th>
                        <th className="pb-2">Email</th>
                        <th className="pb-2">Rol</th>
                        <th className="pb-2">XP</th>
                        <th className="pb-2">Nivel</th>
                        <th className="pb-2">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminUsers.map((user) => (
                        <tr key={user.id} className="border-b border-[#f1f4f7]/50 hover:bg-[#f8fafc] transition-colors">
                          <td className="py-3 font-bold text-[#181c1e]">{user.name}</td>
                          <td className="py-3 text-xs text-[#494453]">{user.email}</td>
                          <td className="py-3">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              user.role === 'admin' 
                                ? 'bg-[#ba1a1a]/10 text-[#ba1a1a]' 
                                : 'bg-[#461599]/10 text-[#461599]'
                            }`}>
                              {user.role === 'admin' ? '👑 Admin' : '👨‍🎓 Estudiante'}
                            </span>
                          </td>
                          <td className="py-3 text-xs font-bold">{user.xp_points || 0}</td>
                          <td className="py-3 text-xs font-bold">{user.level || 1}</td>
                          <td className="py-3 flex gap-1">
                            {user.role === 'student' ? (
                              <button 
                                onClick={() => changeUserRole(user.id, 'admin')}
                                className="px-2 py-1 bg-[#461599]/10 hover:bg-[#461599]/20 text-[#461599] text-[9px] font-bold rounded transition-colors"
                              >
                                Hacer Admin
                              </button>
                            ) : (
                              <button 
                                onClick={() => changeUserRole(user.id, 'student')}
                                className="px-2 py-1 bg-[#ffdad6] hover:bg-[#ffc9c4] text-[#ba1a1a] text-[9px] font-bold rounded transition-colors"
                              >
                                Quitar Admin
                              </button>
                            )}
                            <button 
                              onClick={() => deleteUser(user.id)}
                              className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 text-[9px] font-bold rounded transition-colors"
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white border border-[#cbc3d5]/35 rounded-[2rem] p-6 shadow-sm">
                <h3 className="text-sm font-bold text-[#181c1e] flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-[#461599] text-lg">history</span>
                  Actividad Reciente del Sistema
                </h3>

                <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                  {adminActivities.length === 0 ? (
                    <p className="text-xs text-[#7b7484] italic text-center py-8">No hay actividad reciente</p>
                  ) : (
                    adminActivities.map((act, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-[#f8fafc] rounded-xl hover:bg-[#f1f4f7] transition-colors">
                        <div className="w-8 h-8 rounded-full bg-[#461599]/10 text-[#461599] flex items-center justify-center text-xs font-bold">
                          {act.user_name?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-[#181c1e]">{act.user_name}</p>
                          <p className="text-[11px] text-[#494453]">{act.action}</p>
                          {act.details && (
                            <p className="text-[10px] text-[#7b7484] italic">{act.details}</p>
                          )}
                        </div>
                        <span className="text-[10px] text-[#7b7484] font-medium whitespace-nowrap">
                          {new Date(act.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}

        </main>
      </div>
    </div>
  );
}