export const currentUser = {
  name: "Sofia",
  avatar: "https://picsum.photos/seed/me/40/40",
};

export const conversations = [
  { id: 1, name: "Elena Rodriguez", lastMessage: "¡Perfecto! Nos vemos el viernes.", timestamp: "10:45 AM", unread: 0, avatar: "https://picsum.photos/seed/1/40/40" },
  { id: 2, name: "Carlos Gomez", lastMessage: "Gracias por la confirmación.", timestamp: "9:30 AM", unread: 2, avatar: "https://picsum.photos/seed/2/40/40" },
  { id: 3, name: "Ana Perez", lastMessage: "Quería saber si tienen disponibilidad para...", timestamp: "Ayer", unread: 0, avatar: "https://picsum.photos/seed/3/40/40" },
  { id: 4, name: "Luisa Martinez", lastMessage: "Adjunto el comprobante de pago.", timestamp: "Ayer", unread: 0, avatar: "https://picsum.photos/seed/4/40/40" },
  { id: 5, name: "Javier Torres", lastMessage: "¡Me encantó el resultado!", timestamp: "Hace 2 días", unread: 0, avatar: "https://picsum.photos/seed/5/40/40" },
];

export const messages = {
  1: [
    { id: 1, content: "¿Hola! Quería agendar una cita para un corte de pelo.", sender: "Elena Rodriguez", timestamp: "10:40 AM" },
    { id: 2, content: "¡Hola Elena! Claro, tenemos disponibilidad el viernes a las 3 PM. ¿Te queda bien?", sender: "Sofia", timestamp: "10:42 AM" },
    { id: 3, content: "¡Perfecto! Nos vemos el viernes.", sender: "Elena Rodriguez", timestamp: "10:45 AM" },
  ],
  2: [
    { id: 1, content: "Hola, solo para confirmar mi cita de mañana a las 11 AM.", sender: "Carlos Gomez", timestamp: "9:28 AM" },
    { id: 2, content: "¡Hola Carlos! Confirmada tu cita para mañana a las 11 AM.", sender: "Sofia", timestamp: "9:29 AM" },
    { id: 3, content: "Gracias por la confirmación.", sender: "Carlos Gomez", timestamp: "9:30 AM" },
  ],
  3: [
    { id: 1, content: "Quería saber si tienen disponibilidad para un tratamiento de color la próxima semana.", sender: "Ana Perez", timestamp: "Ayer" },
  ],
  4: [
    { id: 1, content: "Adjunto el comprobante de pago.", sender: "Luisa Martinez", timestamp: "Ayer" },
  ],
  5: [
     { id: 1, content: "¡Me encantó el resultado!", sender: "Javier Torres", timestamp: "Hace 2 días" },
  ]
};

export const kpiData = {
    totalMessages: 142,
    avgDailyComm: 20,
    incomingPercentage: 65,
    last7DaysTrend: [
        { day: 'Lun', messages: 15 },
        { day: 'Mar', messages: 25 },
        { day: 'Mié', messages: 18 },
        { day: 'Jue', messages: 30 },
        { day: 'Vie', messages: 22 },
        { day: 'Sáb', messages: 35 },
        { day: 'Dom', messages: 12 },
    ]
};

export const dailyActivity = [
    {
        date: "Hoy, 24 de Julio",
        activities: [
            { time: "10:45 AM", user: "Elena Rodriguez", description: "Confirmó cita para el viernes.", type: "confirmation" },
            { time: "9:30 AM", user: "Carlos Gomez", description: "Confirmó cita para mañana.", type: "confirmation" },
        ]
    },
    {
        date: "Ayer, 23 de Julio",
        activities: [
            { time: "4:15 PM", user: "Ana Perez", description: "Solicitó información sobre tratamiento de color.", type: "inquiry" },
            { time: "2:00 PM", user: "Luisa Martinez", description: "Envió comprobante de pago.", type: "payment" },
        ]
    }
];

export const appointments = [
    { time: "11:00 AM", client: "Carlos Gomez", service: "Corte y Barba", status: "Confirmado" },
    { time: "2:00 PM", client: "Maria Lopez", service: "Coloración", status: "Confirmado" },
    { time: "4:30 PM", client: "Pedro Sanchez", service: "Corte", status: "Pendiente" },
]
