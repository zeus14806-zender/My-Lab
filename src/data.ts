import { ElementData, ActivityItem, LabReport, CourseModule } from './types';

export const ELEMENTS: ElementData[] = [
  { 
    symbol: 'H', 
    name: 'Hidrógeno', 
    number: 1, 
    mass: '1.008', 
    category: 'No Metal', 
    state: 'Gas STP', 
    meltingPoint: '13.99 K', 
    config: '1s¹', 
    discovered: '1766 (Cavendish)', 
    description: 'El hidrógeno es el elemento más abundante del universo. Altamente reactivo y combustible, es la base de las estrellas y de la molécula de agua.' 
  },
  { 
    symbol: 'He', 
    name: 'Helio', 
    number: 2, 
    mass: '4.0026', 
    category: 'Gases Nobles', 
    state: 'Gas STP', 
    meltingPoint: '0.95 K', 
    config: '1s²', 
    discovered: '1868 (Janssen)', 
    description: 'Gas noble inerte y extremadamente liviano. No reacciona en condiciones normales y posee el punto de ebullición más bajo de la naturaleza.' 
  },
  { 
    symbol: 'Li', 
    name: 'Litio', 
    number: 3, 
    mass: '6.94', 
    category: 'Metales Alcalinos', 
    state: 'Sólido STP', 
    meltingPoint: '453.69 K', 
    config: '[He] 2s¹', 
    discovered: '1817 (Arfwedson)', 
    description: 'El metal sólido más ligero y reactivo de la tabla periódica. Reacciona vigorosamente con el agua y es clave en baterías recargables modernas.' 
  },
  { 
    symbol: 'Be', 
    name: 'Berilio', 
    number: 4, 
    mass: '9.0122', 
    category: 'Metales de Transición', 
    state: 'Sólido STP', 
    meltingPoint: '1560 K', 
    config: '[He] 2s²', 
    discovered: '1798 (Vauquelin)', 
    description: 'Metal alcalinotérreo raro y tóxico de color grisáceo, de gran rigidez estructural pero con propiedades elásticas excepcionales.' 
  },
  { 
    symbol: 'B', 
    name: 'Boro', 
    number: 5, 
    mass: '10.81', 
    category: 'Metaloides', 
    state: 'Sólido STP', 
    meltingPoint: '2349 K', 
    config: '[He] 2s² 2p¹', 
    discovered: '1808 (Davy)', 
    description: 'Metaloide semiconductor con enlaces covalentes complejos. Se emplea para fabricar vidrios de borosilicato de alta resistencia térmica.' 
  },
  { 
    symbol: 'C', 
    name: 'Carbono', 
    number: 6, 
    mass: '12.011', 
    category: 'No Metal', 
    state: 'Sólido STP', 
    meltingPoint: '3823 K', 
    config: '[He] 2s² 2p²', 
    discovered: 'Antigüedad', 
    description: 'La piedra angular de la vida orgánica en la Tierra. Su capacidad única para formar enlaces estables con cuatro átomos genera millones de biomoléculas.' 
  },
  { 
    symbol: 'N', 
    name: 'Nitrógeno', 
    number: 7, 
    mass: '14.007', 
    category: 'No Metal', 
    state: 'Gas STP', 
    meltingPoint: '63.15 K', 
    config: '[He] 2s² 2p³', 
    discovered: '1772 (Rutherford)', 
    description: 'Gas incoloro e inodoro que compone el 78% de la atmósfera terrestre. Vital en proteínas y fertilización orgánica.' 
  },
  { 
    symbol: 'O', 
    name: 'Oxígeno', 
    number: 8, 
    mass: '15.999', 
    category: 'No Metal', 
    state: 'Gas STP', 
    meltingPoint: '54.36 K', 
    config: '[He] 2s² 2p⁴', 
    discovered: '1774 (Priestley)', 
    description: 'Elemento altamente reactivo e indispensable para la respiración aeróbica celulizadora y la combustión.' 
  },
  { 
    symbol: 'F', 
    name: 'Flúor', 
    number: 9, 
    mass: '18.998', 
    category: 'Halógenos', 
    state: 'Gas STP', 
    meltingPoint: '53.48 K', 
    config: '[He] 2s² 2p⁵', 
    discovered: '1886 (Moissan)', 
    description: 'El halógeno más reactivo y electronegativo de todos. Capaz de combustionar de forma explosiva casi cualquier material combustible.' 
  },
  { 
    symbol: 'Ne', 
    name: 'Neón', 
    number: 10, 
    mass: '20.180', 
    category: 'Gases Nobles', 
    state: 'Gas STP', 
    meltingPoint: '24.56 K', 
    config: '[He] 2s² 2p⁶', 
    discovered: '1898 (Ramsay)', 
    description: 'Gas noble que brilla de forma incandescente con un característico tono naranja-rojizo al pasar corriente a través de tubos de descarga.' 
  },
  { 
    symbol: 'Na', 
    name: 'Sodio', 
    number: 11, 
    mass: '22.990', 
    category: 'Metales Alcalinos', 
    state: 'Sólido STP', 
    meltingPoint: '370.87 K', 
    config: '[Ne] 3s¹', 
    discovered: '1807 (Davy)', 
    description: 'Metal blando y alcalino. Altamente inestable en contacto con el agua desatando reacciones redox sumamente exotérmicas que liberan gas de hidrógeno.' 
  },
  { 
    symbol: 'Mg', 
    name: 'Magnesio', 
    number: 12, 
    mass: '24.305', 
    category: 'Metales de Transición', 
    state: 'Sólido STP', 
    meltingPoint: '923 K', 
    config: '[Ne] 3s²', 
    discovered: '1755 (Black)', 
    description: 'Metal abundante en la naturaleza que al quemarse en oxígeno genera una luz blanca brillante de temperatura altísima.' 
  },
  { 
    symbol: 'Al', 
    name: 'Aluminio', 
    number: 13, 
    mass: '26.982', 
    category: 'Metales de Transición', 
    state: 'Sólido STP', 
    meltingPoint: '933.47 K', 
    config: '[Ne] 3s² 3p¹', 
    discovered: '1825 (Oersted)', 
    description: 'Metal post-transición caracterizado por su excelente relación resistencia-peso y su extrema resistencia a la corrosión galvánica.' 
  },
  { 
    symbol: 'Si', 
    name: 'Silicio', 
    number: 14, 
    mass: '28.085', 
    category: 'Metaloides', 
    state: 'Sólido STP', 
    meltingPoint: '1687 K', 
    config: '[Ne] 3s² 3p²', 
    discovered: '1823 (Berzelius)', 
    description: 'Metaloide tetravalente abundante en la corteza terrestre. Es el cimiento absoluto de la electrónica moderna de semiconductores.' 
  },
  { 
    symbol: 'P', 
    name: 'Fósforo', 
    number: 15, 
    mass: '30.974', 
    category: 'No Metal', 
    state: 'Sólido STP', 
    meltingPoint: '317.30 K', 
    config: '[Ne] 3s² 3p³', 
    discovered: '1669 (Brand)', 
    description: 'No metal altamente reactivo. El fósforo blanco es pirofórico, mientras que el fósforo rojo es un componente seguro en fósforos de encendido.' 
  },
  { 
    symbol: 'S', 
    name: 'Azufre', 
    number: 16, 
    mass: '32.06', 
    category: 'No Metal', 
    state: 'Sólido STP', 
    meltingPoint: '388.36 K', 
    config: '[Ne] 3s² 3p⁴', 
    discovered: 'Antigüedad', 
    description: 'No metal de color amarillo pálido y olor sutil, fundamental en la síntesis de aminoácidos esenciales y la química industrial.' 
  },
  { 
    symbol: 'Cl', 
    name: 'Cloro', 
    number: 17, 
    mass: '35.45', 
    category: 'Halógenos', 
    state: 'Gas STP', 
    meltingPoint: '171.6 K', 
    config: '[Ne] 3s² 3p⁵', 
    discovered: '1774 (Scheele)', 
    description: 'Halógeno gaseoso de color amarillo verdoso, denso y reactivo. Ampliamente empleado para saneamiento, purificación y compuestos orgánicos.' 
  },
  { 
    symbol: 'Ar', 
    name: 'Argón', 
    number: 18, 
    mass: '39.948', 
    category: 'Gases Nobles', 
    state: 'Gas STP', 
    meltingPoint: '83.8 K', 
    config: '[Ne] 3s² 3p⁶', 
    discovered: '1894 (Rayleigh)', 
    description: 'El gas noble más abundante en la corteza terrestre. No es reactivo y provee atmósferas inertes perfectas para procesos de soldadura avanzada.' 
  },
  { 
    symbol: 'K', 
    name: 'Potasio', 
    number: 19, 
    mass: '39.0983', 
    category: 'Metales Alcalinos', 
    state: 'Sólido STP', 
    meltingPoint: '336.5 K', 
    config: '[Ar] 4s¹', 
    discovered: '1807 (Davy)', 
    description: 'Metal alcalino extremadamente blando que se oxida en segundos y reacciona liberando calor al contacto con humedales.' 
  },
  { 
    symbol: 'Ca', 
    name: 'Calcio', 
    number: 20, 
    mass: '40.078', 
    category: 'Metales de Transición', 
    state: 'Sólido STP', 
    meltingPoint: '1115 K', 
    config: '[Ar] 4s²', 
    discovered: '1808 (Davy)', 
    description: 'Metal alcalinotérreo esencial para la rigidez ósea, la transmisión de impulsos neuromotores y la biosfera marina continental.' 
  },
  { 
    symbol: 'Au', 
    name: 'Oro', 
    number: 79, 
    mass: '196.97', 
    category: 'Metales de Transición', 
    state: 'Sólido STP', 
    meltingPoint: '1337.33 K', 
    config: '[Xe] 4f¹⁴ 5d¹⁰ 6s¹', 
    discovered: 'Antigüedad', 
    description: 'Metal de transición noble, amarillo brillante, blando, extremadamente maleable, y resistente a casi toda corrosión ácida.' 
  }
];

export const RECENT_ACTIVITIES: ActivityItem[] = [
  { 
    id: 'act1', 
    student: 'Mateo Rico', 
    initials: 'MR', 
    action: 'Simuló con éxito equilibrio de combustión en reactor', 
    time: 'Hace 5 min', 
    bgAvatarClass: 'bg-[#eaddff]', 
    avatarTextColor: 'text-[#24005b]' 
  },
  { 
    id: 'act2', 
    student: 'Sofia Luna', 
    initials: 'SL', 
    action: 'Cargó Reporte de Solubilidad de Sales en Laboratorio', 
    time: 'Hace 12 min', 
    bgAvatarClass: 'bg-primary/20', 
    avatarTextColor: 'text-primary' 
  },
  { 
    id: 'act3', 
    student: 'Juan Carlos P.', 
    initials: 'JP', 
    action: 'Completó Cuestionario 4 con calificación perfecta', 
    time: 'Hace 24 min', 
    bgAvatarClass: 'bg-[#ffe087]', 
    avatarTextColor: 'text-[#241a00]' 
  },
  { 
    id: 'act4', 
    student: 'Ana García', 
    initials: 'AG', 
    action: 'Habilitó módulo de Química Orgánica: Alquinos', 
    time: 'Hace 1 hora', 
    bgAvatarClass: 'bg-[#ffd9e1]', 
    avatarTextColor: 'text-[#3f001b]' 
  }
];

export const PENDING_REPORTS: LabReport[] = [
  { 
    id: 'rep1', 
    title: 'Estequiometría Avanzada', 
    sender: 'Mateo Rico', 
    priority: 'Alta', 
    content: 'El informe detalla el cálculo teórico de reactivo limitante en la neutralización de Ácido Clorhídrico con Hidróxido de Sodio. Los coeficientes se correlacionan 1:1, obteniendo una masa neta de NaCl coincidente con la estequiometría.' 
  },
  { 
    id: 'rep2', 
    title: 'Equilibrio Ácido-Base', 
    sender: 'Sofia Luna', 
    priority: 'Media', 
    content: 'Análisis detallado del viraje cromático del reactivo fenolftaleína. Se cuantifica el pH de la disolución al iniciar el goteo de reactivo básico, registrando valores estables y un súbito incremento que valida la ecuación de Henderson-Hasselbalch.' 
  },
  { 
    id: 'rep3', 
    title: 'Solubilidad de Sales', 
    sender: 'Ana García', 
    priority: 'Baja', 
    content: 'Evaluación de los cambios de sedimentación de Cloruro de Plata a diferentes isotermas. Se evidencia una saturación acelerada por debajo de 25°C que corrobora la ley del producto de solubilidad (Ksp).' 
  }
];

export const COURSE_MODULES: CourseModule[] = [
  { 
    id: 'mod1', 
    title: 'Tabla Periódica Interactiva', 
    year: '4º Año', 
    subject: 'Física y Química', 
    status: 'Iniciado', 
    color: '#461599', 
    bgColor: 'bg-primary/10',
    imageUrl: 'grid_view' 
  },
  { 
    id: 'mod2', 
    title: 'Equilibrio Químico y pH', 
    year: '5º Año', 
    subject: 'Química Avanzada', 
    status: 'Listo', 
    color: '#735c00', 
    bgColor: 'bg-[#ffe087]/30',
    imageUrl: 'thermostat' 
  },
  { 
    id: 'mod3', 
    title: 'Química Orgánica: Hidrocarburos', 
    year: '4º Año', 
    subject: 'Fundamentos', 
    status: 'En Progreso', 
    color: '#760038', 
    bgColor: 'bg-[#ffd9e1]/40',
    imageUrl: 'bubble_chart' 
  }
];
