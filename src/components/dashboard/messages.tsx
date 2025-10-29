'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Send, Sparkles, Loader2, Bot, MessageSquare, Lightbulb } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { generateConversationSummary } from '@/ai/flows/generate-conversation-summary';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';

type Chat = {
  chat_id: string;
  contact_name: string;
  last_text: string;
  last_message_at: string;
  direction: 'inbound' | 'outbound';
};

type Message = {
  id: number;
  chat_id: string;
  text_display: string;
  direction: 'inbound' | 'outbound';
  sender: 'human' | 'ai';
  timestamp: string;
};

const AvatarWomanIcon = ({ className }: { className?: string }) => (
    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512" xmlSpace="preserve" className={className}>
        <g>
            <path fill="currentColor" d="M452.786,427.066l-3.633-23.125c-3.043-19.389-15.223-36.129-32.748-44.975l-76.414-38.648 c-10.272-5.188-12.996-21.121-12.996-21.121c-0.644-1.039-1.844-1.602-3.051-1.414c-1.209,0.18-2.191,1.058-2.51,2.238 l-8.949,34.434l-56.492,112.824l-56.482-112.824l-8.959-34.434c-0.308-1.18-1.301-2.059-2.51-2.238 c-1.209-0.188-2.397,0.375-3.043,1.414c0,0-2.724,15.934-12.994,21.121l-76.424,38.648c-17.508,8.846-29.687,25.586-32.73,44.975 l-3.642,23.125c-1.281,8.258,0.422,20.373,7.808,26.43C76.903,461.576,113.425,512,255.993,512 c142.578,0,179.09-50.424,188.984-58.504C452.376,447.44,454.079,435.324,452.786,427.066z"></path>
            <path fill="currentColor" d="M183.427,173.959c-1.676-46.97,69.898-44.937,102.133-97.3c9.764,17.75,26.634,43.693,42.166,64.738 c0.244,100.953,7.302,174.971,79.682,138.778c0,0-38.309-23.098-40.266-55.36c-3.362-55.367,4.26-95.916,0-124.676 c-0.338-2.352-0.844-4.738-1.387-7.135C360.362,38.178,312.167,0.178,256.339,0.02C256.124,0,255.993,0,255.993,0 c-62.231,0-104.446,54.844-111.149,100.139c-4.26,28.76,3.362,69.308,0,124.676c-1.957,32.262-40.267,55.36-40.267,55.36 C178.39,317.088,186.114,249.279,183.427,173.959z"></path>
        </g>
    </svg>
);

const AvatarManIcon = ({ className }: { className?: string }) => (
    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512" xmlSpace="preserve" className={className}>
         <g>
            <path fill="currentColor" d="M432.871,404.268c-10.756-18.361-27.411-29.408-43.426-36.782c-16.038-7.367-31.903-11.337-41.438-14.935 c-7.56-2.808-15.799-7.195-21.676-11.948c-2.943-2.346-5.274-4.782-6.674-6.904c-1.446-2.13-1.885-3.784-1.885-4.894 c0-7.591,0-11.025,0-22.57c10.116-11.263,24.655-28.7,30.615-56.358c2.093-0.938,4.156-1.996,6.138-3.389 c4.96-3.412,9.154-8.365,12.708-15.106c3.59-6.771,6.756-15.427,10.138-27.27c1.706-6.011,2.51-11.226,2.51-15.874 c0-5.356-1.103-9.996-3.129-13.772c-1.743-3.293-4.127-5.661-6.592-7.419c32.73-73.058-9.289-131.94-9.289-131.94l12.335-31.709 c0,0-52.849,3.523-99.814-1.758c-135.694-15.247-143.277,79.858-143.277,122.13c0,25.326,3.784,40.045,7.061,48.06 c-0.663,0.871-1.378,1.631-1.929,2.644c-2.018,3.769-3.121,8.417-3.121,13.772c0.015,4.64,0.797,9.855,2.518,15.866 c4.529,15.769,8.611,25.944,13.9,33.422c2.652,3.71,5.654,6.69,8.931,8.954c1.996,1.393,4.06,2.451,6.138,3.389 c5.974,27.642,20.506,45.087,30.622,56.35c0,11.546,0,14.987,0,22.578c0.022,0.946-0.455,2.681-2.026,4.924 c-2.287,3.359-6.771,7.359-11.985,10.741c-5.192,3.404-11.106,6.287-16.074,8.03c-6.458,2.279-15.732,4.819-25.885,8.409 c-15.248,5.401-32.73,13.178-46.726,27.151c-14.018,13.914-23.985,34.316-23.902,62.324c0,3.561,0.156,7.256,0.484,11.062 c0.209,2.391,1.042,4.365,2.048,6.049c1.944,3.136,4.558,5.571,7.844,8.045c5.758,4.268,13.75,8.469,24.141,12.611 c31.062,12.342,83.614,23.836,153.855,23.85c57.073-0.007,102.495-7.612,134.168-17.072c15.836-4.738,28.208-9.908,37.095-15.025 c4.461-2.57,8.052-5.117,10.89-7.888c1.415-1.386,2.652-2.831,3.672-4.522c1.02-1.684,1.855-3.658,2.064-6.041 c0.32-3.814,0.469-7.493,0.469-11.039C444.38,431.754,440.045,416.477,432.871,404.268z M243.374,496.291 c-0.246-0.008-0.492-0.008-0.745-0.008l-24.812-58.228l0.32,0.253l22.57-28.216l3.702,15.575h0.991L243.374,496.291z M212.975,426.704l-28.462-66.756c3.568-2.071,7.076-4.35,10.294-6.905c1.966-1.579,3.844-3.24,5.564-5.006l47.56,34.965 L212.975,426.704z M207.068,338.979c1.572-3.053,2.645-6.435,2.66-10.174c0-8.224,0-11.441,0-25.535v-2.979l-1.982-2.205 c-10.57-11.776-24.879-27.404-29.848-55.173l-0.79-4.447l-4.238-1.505c-2.696-0.96-4.744-1.951-6.548-3.195 c-2.644-1.869-5.05-4.425-7.858-9.653c-2.764-5.2-5.714-12.976-8.916-24.261c-1.423-4.924-1.915-8.76-1.915-11.605 c0-3.314,0.633-5.236,1.282-6.465c0.976-1.774,2.175-2.533,3.702-3.143c1.043-0.403,2.145-0.552,2.778-0.604l6.011,1.274 l8.633,14.92c0,0-0.469-74.205,7.047-79.851c9.393-7.054,63.426,14.093,79.858,14.093c16.446,0,68.7-22.905,77.974-15.97 c10.786,8.067,8.931,88.774,8.931,88.774l8.834-22.86l3.621-0.388c0.633,0.008,2.942,0.276,4.514,1.311 c0.879,0.574,1.609,1.236,2.272,2.443c0.641,1.229,1.274,3.151,1.274,6.458c0.014,2.853-0.492,6.689-1.899,11.62 c-4.276,15.046-8.104,23.806-11.628,28.663c-1.758,2.458-3.367,3.986-5.162,5.244c-1.788,1.244-3.851,2.235-6.548,3.195 l-4.238,1.505l-0.782,4.447c-4.953,27.769-19.27,43.397-29.84,55.173l-1.996,2.205v2.979c0,14.094,0,17.311,0,25.535 c0.015,3.724,1.035,7.143,2.592,10.235l-48.857,35.895L207.068,338.979z M269.341,496.35c-0.246,0.015-0.462,0.022-0.716,0.022 l-2.033-70.704h1.028l3.695-15.575l22.562,28.208l0.32-0.246L269.341,496.35z M299.024,426.704l-34.95-43.694l47.516-34.928 c3.247,3.315,6.994,6.294,11.054,8.968c1.564,1.021,3.248,1.862,4.886,2.793L299.024,426.704z"></path>
         </g>
    </svg>
);


export function Messages() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [summary, setSummary] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [avatars, setAvatars] = useState<Record<string, 'man' | 'woman'>>({});
  const [isSummaryDialogOpen, setIsSummaryDialogOpen] = useState(false);

  const handleAvatarToggle = (chatId: string) => {
    setAvatars(prev => ({
        ...prev,
        [chatId]: prev[chatId] === 'woman' ? 'man' : 'woman'
    }));
  };

  useEffect(() => {
    const fetchChats = async () => {
      setLoadingChats(true);
      const { data, error } = await supabase
        .from('chats_v')
        .select('*')
        .order('last_message_at', { ascending: false });

      if (error) {
        console.error('Error fetching chats:', error.message);
        toast({ variant: 'destructive', title: 'Error', description: `No se pudieron cargar los chats: ${error.message}` });
      } else if (data) {
        const validChats = data.filter(chat => chat.last_message_at);
        setChats(validChats);
      }
      setLoadingChats(false);
    };
    fetchChats();
  }, [toast]);
  
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedChat) return;

      setLoadingMessages(true);
      setMessages([]);

      const { data, error } = await supabase
        .from('messages_v')
        .select('*')
        .eq('chat_id', selectedChat.chat_id)
        .order('timestamp', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error.message);
        toast({ variant: 'destructive', title: 'Error', description: `No se pudieron cargar los mensajes: ${error.message}` });
      } else {
        setMessages(data || []);
      }
      setLoadingMessages(false);
    };

    fetchMessages();
  }, [selectedChat, toast]);

  useEffect(() => {
    const handleNewMessage = (payload: any) => {
        const newMessage = payload.new as Message;
        if(newMessage.chat_id === selectedChat?.chat_id) {
            setMessages(currentMessages => [...currentMessages, newMessage]);
        }
        setChats(currentChats => {
            const chatIndex = currentChats.findIndex(c => c.chat_id === newMessage.chat_id);
            if (chatIndex > -1) {
                const updatedChat = {
                    ...currentChats[chatIndex],
                    last_text: newMessage.text_display,
                    last_message_at: newMessage.timestamp,
                    direction: newMessage.direction,
                };
                const otherChats = currentChats.filter(c => c.chat_id !== newMessage.chat_id);
                return [updatedChat, ...otherChats].sort((a, b) => parseISO(b.last_message_at).getTime() - parseISO(a.last_message_at).getTime());
            }
            // If chat is new, it will be added on next full fetch
            return currentChats;
        });
    };

    const channel = supabase.channel('messages-realtime-channel');
    
    channel
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages_v' }, handleNewMessage)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedChat]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo(0, scrollAreaRef.current.scrollHeight);
    }
  }, [messages]);


  const handleSummary = async () => {
    if (!selectedChat || messages.length === 0) return;
    setIsSummarizing(true);
    setSummary('');
    try {
      const result = await generateConversationSummary({ messages: messages.map(m => `${m.sender}: ${m.text_display}`) });
      setSummary(result.summary);
      setIsSummaryDialogOpen(true);
    } catch (error) {
      console.error('Error generating summary:', error);
      toast({ variant: 'destructive', title: 'Error al resumir', description: 'No se pudo generar el resumen. Por favor, inténtalo de nuevo.' });
    } finally {
      setIsSummarizing(false);
    }
  };
  
    const handleSuggestReplies = () => {
    // Placeholder function for suggesting replies
    toast({
        title: 'Próximamente',
        description: 'La función para sugerir respuestas con IA estará disponible pronto.',
    });
  };

  const formatTimestamp = (timestamp: string) => {
    try {
        const date = parseISO(timestamp);
        if (isToday(date)) {
            return format(date, 'p', { locale: es });
        }
        if (isYesterday(date)) {
            return 'Ayer';
        }
        return format(date, 'dd/MM/yy', { locale: es });
    } catch (error) {
        return "Fecha inválida";
    }
  };

  const formatMessageText = (text: string) => {
    if (typeof text !== 'string') return '';
    // This regex looks for the user message and strips the AI prompt context
    const match = text.match(/Mensaje del usuario:\s*(.*?)\s*-\s*La fecha de hoy es/s);
    if (match && match[1]) {
      return match[1].trim();
    }
    // Fallback for other unwanted text
    return text.replace('vuelve a intentarlo', '').trim();
  };
  
  return (
    <div className="h-full flex flex-col md:flex-row">
      {/* Left Panel: Chat List */}
      <div className="w-full md:w-1/3 border-r flex flex-col bg-background">
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar conversaciones..." className="pl-8" />
          </div>
        </div>
        <ScrollArea className="flex-grow">
          {loadingChats ? (
            <div className="p-4 space-y-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                  <div className="h-10 w-10 bg-muted rounded-full"></div>
                  <div className='w-full space-y-2'>
                    <div className="h-4 w-1/2 bg-muted rounded-md"></div>
                    <div className="h-3 w-full bg-muted rounded-md"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            chats.map((chat) => {
              const avatarType = avatars[chat.chat_id] || 'man';
              return (
              <div
                key={chat.chat_id}
                className={cn('flex items-start gap-3 p-3 cursor-pointer hover:bg-muted', selectedChat?.chat_id === chat.chat_id && 'bg-accent hover:bg-accent')}
                onClick={() => setSelectedChat(chat)}
              >
                <div className="cursor-pointer" onClick={(e) => {e.stopPropagation(); handleAvatarToggle(chat.chat_id)}}>
                    <Avatar className="h-10 w-10 border-2 border-transparent hover:border-primary transition-colors">
                        <AvatarFallback className="bg-muted text-muted-foreground">
                            {avatarType === 'woman' ? <AvatarWomanIcon className="w-full h-full" /> : <AvatarManIcon className="w-full h-full" />}
                        </AvatarFallback>
                    </Avatar>
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex justify-between items-center">
                    <p className="font-semibold truncate">{`+${chat.chat_id}`}</p>
                    <p className="text-xs text-muted-foreground flex-shrink-0">{formatTimestamp(chat.last_message_at)}</p>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {chat.direction === 'outbound' ? 'Tú: ' : ''}
                    {formatMessageText(chat.last_text)}
                  </p>
                </div>
              </div>
            )})
          )}
        </ScrollArea>
      </div>

      {/* Right Panel: Chat View */}
      <div className="w-full md:w-2/3 flex flex-col bg-card h-full">
        {selectedChat ? (
          <>
            <div className="p-3 border-b flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                 <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-muted text-muted-foreground">
                        {avatars[selectedChat.chat_id] === 'woman' ? <AvatarWomanIcon className="w-full h-full" /> : <AvatarManIcon className="w-full h-full" />}
                    </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-lg font-semibold">{`+${selectedChat.chat_id}`}</h2>
                  <p className="text-sm text-muted-foreground">En línea</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={handleSummary} disabled={isSummarizing || loadingMessages} size="sm" variant="outline">
                    {isSummarizing ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Resumiendo...</>) : (<><Sparkles className="mr-2 h-4 w-4" /> Resumir</>)}
                </Button>
                <Button onClick={handleSuggestReplies} size="sm" variant="outline">
                    <Lightbulb className="mr-2 h-4 w-4" /> Sugerir
                </Button>
              </div>
            </div>
            <ScrollArea className="flex-grow p-4" viewportRef={scrollAreaRef}>
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div key={msg.id} className={cn('flex items-end gap-2', msg.sender === 'ai' ? 'justify-end' : 'justify-start')}>
                      {msg.sender === 'human' && (
                        <Avatar className="h-8 w-8 bg-muted text-muted-foreground">
                          <AvatarFallback>
                            {avatars[selectedChat.chat_id] === 'woman' ? <AvatarWomanIcon className="w-6 h-6" /> : <AvatarManIcon className="w-6 h-6" />}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className={cn('max-w-xs md:max-w-md lg:max-w-lg rounded-lg px-4 py-2 shadow-md', msg.sender === 'ai' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-background border-border border rounded-bl-none')}>
                        <p className="text-sm">{formatMessageText(msg.text_display)}</p>
                        <p className="text-xs text-right mt-1 opacity-70">{new Date(msg.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      {msg.sender === 'ai' && (
                        <Avatar className="h-8 w-8 bg-accent text-accent-foreground">
                           <AvatarFallback><Bot className="m-auto h-5 w-5" /></AvatarFallback>
                        </Avatar>

                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
            <div className="p-4 border-t bg-background">
              <div className="relative">
                <Input placeholder="Escribe un mensaje..." className="pr-12" />
                <Button size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
            <div className='w-full h-full flex flex-col items-center justify-center text-center p-4'>
                <div className='w-24 h-24 rounded-full bg-muted flex items-center justify-center'>
                    <MessageSquare className='w-12 h-12 text-muted-foreground' />
                </div>
                <h2 className='text-2xl font-bold font-headline mt-4'>Bienvenido al Dashboard de Mensajes</h2>
                <p className="text-muted-foreground">Selecciona una conversación de la lista para empezar a chatear.</p>
            </div>
        )}
      </div>

        <Dialog open={isSummaryDialogOpen} onOpenChange={setIsSummaryDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><Sparkles className="text-accent" /> Resumen de la IA</DialogTitle>
                     <DialogDescription>
                        Este es un resumen de la conversación actual generado por IA.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 text-sm text-muted-foreground whitespace-pre-wrap">
                    {summary || "No se pudo generar un resumen."}
                </div>
                 <div className="flex justify-end">
                    <Button onClick={() => setIsSummaryDialogOpen(false)}>Cerrar</Button>
                </div>
            </DialogContent>
        </Dialog>
    </div>
  );
}
