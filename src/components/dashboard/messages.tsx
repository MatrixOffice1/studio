"use client";

import { useState } from 'react';
import { Search, Send } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { conversations as initialConversations, messages as allMessages, currentUser } from '@/lib/placeholder-data';

type Conversation = typeof initialConversations[0];

export function Messages() {
  const [conversations] = useState(initialConversations);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(conversations[0]);
  const messages = selectedConversation ? allMessages[selectedConversation.id as keyof typeof allMessages] || [] : [];

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
          {conversations.map((convo) => (
            <div
              key={convo.id}
              className={cn(
                "flex items-center gap-3 p-3 cursor-pointer hover:bg-muted",
                selectedConversation?.id === convo.id && "bg-accent hover:bg-accent"
              )}
              onClick={() => setSelectedConversation(convo)}
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={convo.avatar} alt={convo.name} data-ai-hint="person face" />
                <AvatarFallback>{convo.name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <p className="font-semibold">{convo.name}</p>
                  <p className="text-xs text-muted-foreground">{convo.timestamp}</p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground truncate">{convo.lastMessage}</p>
                  {convo.unread > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
                      {convo.unread}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </ScrollArea>
      </div>
      <div className="w-2/3 flex flex-col bg-card">
        {selectedConversation ? (
          <>
            <div className="p-4 border-b flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedConversation.avatar} alt={selectedConversation.name} data-ai-hint="person face" />
                <AvatarFallback>{selectedConversation.name[0]}</AvatarFallback>
              </Avatar>
              <h2 className="text-lg font-semibold">{selectedConversation.name}</h2>
            </div>
            <ScrollArea className="flex-grow p-4">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex items-end gap-2",
                      msg.sender === currentUser.name ? "justify-end" : "justify-start"
                    )}
                  >
                    {msg.sender !== currentUser.name && (
                       <Avatar className="h-8 w-8">
                         <AvatarImage src={selectedConversation.avatar} alt={selectedConversation.name} data-ai-hint="person face" />
                         <AvatarFallback>{selectedConversation.name[0]}</AvatarFallback>
                       </Avatar>
                    )}
                    <div
                      className={cn(
                        "max-w-xs md:max-w-md lg:max-w-lg rounded-lg px-4 py-2",
                        msg.sender === currentUser.name
                          ? "bg-primary text-primary-foreground rounded-br-none"
                          : "bg-muted rounded-bl-none"
                      )}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <p className="text-xs text-right mt-1 opacity-70">{msg.timestamp}</p>
                    </div>
                     {msg.sender === currentUser.name && (
                       <Avatar className="h-8 w-8">
                         <AvatarImage src={currentUser.avatar} alt={currentUser.name} data-ai-hint="professional headshot" />
                         <AvatarFallback>{currentUser.name[0]}</AvatarFallback>
                       </Avatar>
                    )}
                  </div>
                ))}
              </div>
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
          <div className="flex-grow flex items-center justify-center text-muted-foreground">
            <p>Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}
