'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Send, Sparkles, Loader2, Bot } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { generateConversationSummary } from '@/ai/flows/generate-conversation-summary';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

type Chat = {
  chat_id: string;
  contact_name: string;
  last_text: string;
  last_message_at: string;
};

type Message = {
  id: number;
  chat_id: string;
  text_display: string;
  direction: 'inbound' | 'outbound';
  sender: 'human' | 'ai';
  timestamp: string;
};

type ChatAvatar = {
    chat_id: string;
    avatar_type: 'man' | 'woman';
};

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
  const [avatarTypes, setAvatarTypes] = useState<Record<string, 'man' | 'woman'>>({});

  useEffect(() => {
    const fetchChatsAndAvatars = async () => {
      setLoadingChats(true);
      
      const { data: chatsData, error: chatsError } = await supabase
        .from('chats_v')
        .select('*')
        .order('last_message_at', { ascending: false });

      const { data: avatarsData, error: avatarsError } = await supabase
        .from('chat_avatars')
        .select('chat_id, avatar_type');

      if (chatsError) {
        console.error('Error fetching chats:', chatsError.message);
        toast({ variant: 'destructive', title: 'Error', description: `No se pudieron cargar los chats: ${chatsError.message}` });
      }
      
      if (avatarsError) {
        console.error('Error fetching avatars:', avatarsError.message);
      }

      if (chatsData) {
        const validChats = chatsData.filter(chat => chat.last_message_at);
        const avatarsMap: Record<string, 'man' | 'woman'> = {};
        if (avatarsData) {
            avatarsData.forEach(avatar => {
                avatarsMap[avatar.chat_id] = avatar.avatar_type;
            });
        }
        
        const chatsWithAvatars = validChats.map(chat => ({
            ...chat,
            avatar_type: avatarsMap[chat.chat_id] || 'man'
        }));

        setChats(chatsWithAvatars);
        setAvatarTypes(avatarsMap);
        if (chatsWithAvatars.length > 0) {
            setSelectedChat(chatsWithAvatars[0]);
        }
      }
      setLoadingChats(false);
    };

    fetchChatsAndAvatars();
  }, [toast]);
  
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedChat) return;

      setLoadingMessages(true);
      setMessages([]);
      setSummary('');

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
                };
                const otherChats = currentChats.filter(c => c.chat_id !== newMessage.chat_id);
                return [updatedChat, ...otherChats].sort((a, b) => parseISO(b.last_message_at).getTime() - parseISO(a.last_message_at).getTime());
            }
            return currentChats;
        });
    };
    
    const messageSubscription = supabase
      .channel(`public:messages_v:${selectedChat?.chat_id || '*'}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages_v' }, handleNewMessage)
      .subscribe();

    const avatarSubscription = supabase
      .channel('public:chat_avatars')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_avatars' }, (payload) => {
          const newAvatar = payload.new as ChatAvatar;
          if (newAvatar) {
            const { chat_id, avatar_type } = newAvatar;
            setAvatarTypes(prev => ({...prev, [chat_id]: avatar_type}));
          }
      }).subscribe();

    return () => {
      supabase.removeChannel(messageSubscription);
      supabase.removeChannel(avatarSubscription);
    };
  }, [selectedChat]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo(0, scrollAreaRef.current.scrollHeight);
    }
  }, [messages]);

  const handleAvatarClick = async (chatId: string) => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        toast({ variant: "destructive", title: "Error de autenticación", description: "Debes iniciar sesión para cambiar el avatar." });
        return;
    }

    const currentType = avatarTypes[chatId] || 'man';
    const newType = currentType === 'man' ? 'woman' : 'man';

    const { data: existing, error: selectError } = await supabase
      .from('chat_avatars')
      .select('chat_id')
      .eq('chat_id', chatId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (selectError) {
      console.error("Error checking avatar:", selectError.message);
      toast({ variant: "destructive", title: "Error", description: `No se pudo verificar el avatar: ${selectError.message}` });
      return;
    }

    let error;
    if (existing) {
      ({ error } = await supabase
        .from('chat_avatars')
        .update({ avatar_type: newType })
        .eq('chat_id', chatId)
        .eq('user_id', user.id));
    } else {
      ({ error } = await supabase
        .from('chat_avatars')
        .insert({ chat_id: chatId, avatar_type: newType, user_id: user.id }));
    }

    if (error) {
        console.error("Error updating avatar:", error.message);
        toast({ variant: "destructive", title: "Error", description: `No se pudo cambiar el avatar: ${error.message}` });
    } else {
        setAvatarTypes(prev => ({...prev, [chatId]: newType}));
    }
  };

  const handleSummary = async () => {
    if (!selectedChat || messages.length === 0) return;
    setIsSummarizing(true);
    setSummary('');
    try {
      const result = await generateConversationSummary({ messages: messages.map(m => `${m.sender}: ${m.text_display}`) });
      setSummary(result.summary);
    } catch (error) {
      console.error('Error generating summary:', error);
      toast({ variant: 'destructive', title: 'Error al resumir', description: 'No se pudo generar el resumen. Por favor, inténtalo de nuevo.' });
    } finally {
      setIsSummarizing(false);
    }
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

  const formatMessageText = (text: string, direction?: 'inbound' | 'outbound' ) => {
    if (typeof text !== 'string') return '';
    let cleanedText = text;
    if (text.startsWith("Mensaje del usuario:")) {
      const match = text.match(/Mensaje del usuario: (.*?)\s*-\s*La fecha de hoy es/s);
      cleanedText = match && match[1] ? match[1].trim() : text;
    }
    
    if (direction) {
        const prefix = direction === 'outbound' ? 'Tú: ' : 'Cliente: ';
        return prefix + cleanedText;
    }
    return cleanedText;
  };
  
  const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
  );

  const WomanIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user-round"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>
  );
  
  const ManIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-person-standing"><circle cx="12" cy="5" r="1"/><path d="m9 20 3-6 3 6"/><path d="m6 8 6 2 6-2"/><path d="M12 10v4"/></svg>
  );

  const AvatarIcon = ({ type }: { type?: 'man' | 'woman' }) => {
    if (type === 'woman') return <WomanIcon />;
    return <ManIcon />;
  };

  return (
    <div className="h-full flex">
      <div className="w-1/3 border-r flex flex-col">
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar conversaciones..." className="pl-8" />
          </div>
        </div>
        <ScrollArea className="flex-grow">
          {loadingChats ? (
            <div className="p-4 space-y-4">
              {[...Array(5)].map((_, i) => (
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
            chats.map((chat) => (
              <div
                key={chat.chat_id}
                className={cn('flex items-start gap-3 p-3 cursor-pointer hover:bg-muted', selectedChat?.chat_id === chat.chat_id && 'bg-accent hover:bg-accent')}
                onClick={() => setSelectedChat(chat)}
              >
                <div className="cursor-pointer" onClick={(e) => {e.stopPropagation(); handleAvatarClick(chat.chat_id)}}>
                    <Avatar className="h-10 w-10 border-2 border-transparent hover:border-primary transition-colors">
                        <AvatarFallback className="bg-muted text-muted-foreground">
                            <AvatarIcon type={avatarTypes[chat.chat_id]} />
                        </AvatarFallback>
                    </Avatar>
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex justify-between items-center">
                    <p className="font-semibold truncate">{chat.contact_name}</p>
                    <p className="text-xs text-muted-foreground flex-shrink-0">{formatTimestamp(chat.last_message_at)}</p>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{`+${chat.chat_id}`}</p>
                  <p className="text-sm text-muted-foreground truncate">{formatMessageText(chat.last_text, chat.chat_id === messages.slice(-1)[0]?.chat_id ? messages.slice(-1)[0]?.direction : undefined)}</p>
                </div>
              </div>
            ))
          )}
        </ScrollArea>
      </div>
      <div className="w-2/3 flex flex-col bg-card">
        {selectedChat ? (
          <>
            <div className="p-4 border-b flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                 <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-muted text-muted-foreground">
                        <AvatarIcon type={avatarTypes[selectedChat.chat_id]} />
                    </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-lg font-semibold">{selectedChat.contact_name}</h2>
                  <p className="text-sm text-muted-foreground">{`+${selectedChat.chat_id}`}</p>
                </div>
              </div>
              <Button onClick={handleSummary} disabled={isSummarizing || loadingMessages} size="sm">
                {isSummarizing ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Resumiendo...</>) : (<><Sparkles className="mr-2 h-4 w-4" /> Resumir</>)}
              </Button>
            </div>
            <ScrollArea className="flex-grow p-4" viewportRef={scrollAreaRef}>
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
              ) : (
                <div className="space-y-4">
                  {summary && (
                    <div className="w-full p-4 border rounded-lg bg-background my-4">
                      <h4 className="font-semibold mb-2 flex items-center gap-2"><Sparkles className="text-accent h-4 w-4" /> Resumen IA</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{summary}</p>
                    </div>
                  )}
                  {messages.map((msg) => (
                    <div key={msg.id} className={cn('flex items-end gap-2', msg.sender === 'ai' ? 'justify-end' : 'justify-start')}>
                      {msg.sender === 'human' && (
                        <Avatar className="h-8 w-8 bg-muted text-muted-foreground">
                          <AvatarFallback><UserIcon /></AvatarFallback>
                        </Avatar>
                      )}
                      <div className={cn('max-w-xs md:max-w-md lg:max-w-lg rounded-lg px-4 py-2 shadow-md', msg.sender === 'ai' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-card border-border border rounded-bl-none')}>
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
        ) : (!loadingChats && <div className="flex-grow flex items-center justify-center text-muted-foreground"><p>Selecciona una conversación para empezar a chatear</p></div>)}
      </div>
    </div>
  );
}

    
