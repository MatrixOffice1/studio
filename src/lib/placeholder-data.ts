export const currentUser = {
  name: "Sofia",
  avatar: "https://picsum.photos/seed/me/40/40",
};

// This data is now fetched from Supabase, but kept for reference or fallback.
export const conversations = [];
export const messages = {};

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
        { day 'Dom', messages: 12 },
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
