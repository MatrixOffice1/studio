'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Send, Sparkles, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { generateConversationSummary } from '@/ai/flows/generate-conversation-summary';
import { format, parseISO, formatDistanceToNowStrict } from 'date-fns';
import { es } from 'date-fns/locale';

// Types based on Supabase views
type Chat = {
  chat_id: string;
  contact_name: string;
  last_message: string;
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

  // Fetch initial chats
  useEffect(() => {
    const fetchChats = async () => {
      setLoadingChats(true);
      const { data, error } = await supabase
        .from('chats_v')
        .select('*')
        .order('last_message_at', { ascending: false });

      if (error) {
        console.error('Error fetching chats:', error.message);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: `Could not load chats: ${error.message}`,
        });
      } else if (data) {
        setChats(data);
        if (data.length > 0) {
          setSelectedChat(data[0]);
        }
      }
      setLoadingChats(false);
    };

    fetchChats();
  }, [toast]);

  // Fetch messages for the selected chat
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedChat) return;

      setLoadingMessages(true);
      setMessages([]);
      setSummary(''); // Clear previous summary

      const { data, error } = await supabase
        .from('messages_v')
        .select('*')
        .eq('chat_id', selectedChat.chat_id)
        .order('timestamp', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error.message);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: `Could not load messages for this chat: ${error.message}`,
        });
      } else {
        setMessages(data || []);
      }
      setLoadingMessages(false);
    };

    fetchMessages();
  }, [selectedChat, toast]);

  // Subscribe to real-time updates
  useEffect(() => {
    const chatSubscription = supabase
      .channel('public:chats_v')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chats_v' },
        (payload) => {
          console.log('Chat change received!', payload);
          // Simple refetch for now
           const fetchChats = async () => {
              const { data, error } = await supabase
                .from('chats_v')
                .select('*')
                .order('last_message_at', { ascending: false });
              if(data) setChats(data);
            };
            fetchChats();
        }
      )
      .subscribe();
      
    const messageSubscription = supabase
      .channel(`public:messages_v:${selectedChat?.chat_id}`)
      .on(
        'postgres_changes',
        { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'messages_v', 
            filter: `chat_id=eq.${selectedChat?.chat_id}` 
        },
        (payload) => {
          console.log('New message received!', payload);
          setMessages(currentMessages => [...currentMessages, payload.new as Message]);
        }
      )
      .subscribe();


    return () => {
      supabase.removeChannel(chatSubscription);
      supabase.removeChannel(messageSubscription);
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
      const result = await generateConversationSummary({
        messages: messages.map(m => `${m.sender}: ${m.text_display}`),
      });
      setSummary(result.summary);
    } catch (error) {
      console.error('Error generating summary:', error);
      toast({
        variant: 'destructive',
        title: 'Summary Failed',
        description: 'Could not generate AI summary. Please try again.',
      });
    } finally {
      setIsSummarizing(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
        const date = parseISO(timestamp);
        return formatDistanceToNowStrict(date, { addSuffix: true, locale: es });
    } catch (error) {
        return "Invalid date";
    }
  }

  return (
    <div className="h-full flex">
      <div className="w-1/3 border-r flex flex-col">
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search conversations..." className="pl-8" />
          </div>
        </div>
        <ScrollArea className="flex-grow">
          {loadingChats ? (
            <div className="p-4 space-y-4">
              {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3">
                      <Avatar className="h-10 w-10 skeleton-bg"><AvatarFallback></AvatarFallback></Avatar>
                      <div className='w-full space-y-2'>
                        <div className="h-4 w-1/2 skeleton-bg rounded-md"></div>
                        <div className="h-3 w-full skeleton-bg rounded-md"></div>
                      </div>
                  </div>
              ))}
            </div>
          ) : (
            chats.map((chat) => (
              <div
                key={chat.chat_id}
                className={cn(
                  'flex items-center gap-3 p-3 cursor-pointer hover:bg-muted',
                  selectedChat?.chat_id === chat.chat_id && 'bg-accent hover:bg-accent'
                )}
                onClick={() => setSelectedChat(chat)}
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={`https://picsum.photos/seed/${chat.contact_name}/40/40`} alt={chat.contact_name} data-ai-hint="person face" />
                  <AvatarFallback>{chat.contact_name ? chat.contact_name[0] : '?'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <div className="flex justify-between items-center">
                    <p className="font-semibold truncate">{chat.contact_name}</p>
                    <p className="text-xs text-muted-foreground flex-shrink-0">{formatTimestamp(chat.last_message_at)}</p>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{chat.last_message}</p>
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
                  <AvatarImage src={`https://picsum.photos/seed/${selectedChat.contact_name}/40/40`} alt={selectedChat.contact_name} data-ai-hint="person face" />
                  <AvatarFallback>{selectedChat.contact_name ? selectedChat.contact_name[0] : '?'}</AvatarFallback>
                </Avatar>
                <h2 className="text-lg font-semibold">{selectedChat.contact_name}</h2>
              </div>
              <Button onClick={handleSummary} disabled={isSummarizing || loadingMessages} size="sm">
                {isSummarizing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Summarizing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Summarize
                  </>
                )}
              </Button>
            </div>
            <ScrollArea className="flex-grow p-4" viewportRef={scrollAreaRef}>
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-4">
                  {summary && (
                    <div className="w-full p-4 border rounded-lg bg-background my-4">
                        <h4 className="font-semibold mb-2 flex items-center gap-2"><Sparkles className="text-accent h-4 w-4"/> AI Summary</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{summary}</p>
                    </div>
                  )}
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        'flex items-end gap-2',
                        msg.sender === 'ai' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      {msg.sender === 'human' && (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={`https://picsum.photos/seed/${selectedChat.contact_name}/40/40`} alt={selectedChat.contact_name} data-ai-hint="person face" />
                          <AvatarFallback>{selectedChat.contact_name[0]}</AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={cn(
                          'max-w-xs md:max-w-md lg:max-w-lg rounded-lg px-4 py-2',
                          msg.sender === 'ai'
                            ? 'bg-primary text-primary-foreground rounded-br-none'
                            : 'bg-muted rounded-bl-none'
                        )}
                      >
                        <p className="text-sm">{msg.text_display}</p>
                        <p className="text-xs text-right mt-1 opacity-70">{format(parseISO(msg.timestamp), 'p')}</p>
                      </div>
                      {msg.sender === 'ai' && (
                        <Avatar className="h-8 w-8">
                           <AvatarImage src="https://picsum.photos/seed/sofia/40/40" alt="Sofia" data-ai-hint="professional headshot" />
                           <AvatarFallback>S</AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
            <div className="p-4 border-t bg-background">
              <div className="relative">
                <Input placeholder="Type a message..." className="pr-12" />
                <Button size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          !loadingChats && (
            <div className="flex-grow flex items-center justify-center text-muted-foreground">
              <p>Select a conversation to start chatting</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
