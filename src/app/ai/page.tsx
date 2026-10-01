"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bot,
  User,
  Send,
  Sparkles,
  BookOpen,
  ExternalLink,
  RotateCcw,
  Loader2,
  HelpCircle,
} from "lucide-react";
import { ChatMessage, ChatSource } from "@/types";

const SUGGESTED_PROMPTS = [
  "What is the optimal rest time between sets for hypertrophy according to Brad Schoenfeld?",
  "How many sets per week per muscle group are needed for maximal muscle growth?",
  "Should I train to muscular failure on every set or leave reps in reserve?",
  "What daily protein intake does research recommend for hypertrophy?",
];

function AICoachChat() {
  const searchParams = useSearchParams();
  const initialPrompt = searchParams.get("prompt");

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-msg",
      role: "assistant",
      content: `Hello! I am your **Hypertrophy Lab AI Coach**. Every piece of advice I provide is grounded in peer-reviewed exercise science and empirical literature from researchers like **Dr. Brad Schoenfeld**, **Dr. Stuart Phillips**, and **Alan Aragon**.\n\nAsk me about optimal rest periods, weekly set volume, rep ranges, training to failure, or specific exercise selection!`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Handle prefilled prompt from URL
  useEffect(() => {
    if (initialPrompt && messages.length === 1) {
      sendMessage(initialPrompt);
    }
  }, [initialPrompt]);

  const sendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Chat request failed");
      }

      const data = await response.json();
      const botMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.content,
        sources: data.sources || [],
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Sorry, I encountered an issue generating a response. Please check your connection and try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: "welcome-msg",
        role: "assistant",
        content: `Chat reset. Ask me anything about hypertrophy science, program design, rest timers, or nutrition!`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto flex flex-col h-[calc(100vh-8.5rem)]">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-foreground flex items-center gap-2">
              Evidence-Based AI Coach
              <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-400">
                Schoenfeld Sports Science Grounded
              </Badge>
            </h1>
            <p className="text-xs text-muted-foreground">
              Trained on peer-reviewed hypertrophy research & PubMed citations
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleResetChat}
          className="text-xs text-muted-foreground hover:text-foreground h-8"
        >
          <RotateCcw className="w-3.5 h-3.5 mr-1" /> New Chat
        </Button>
      </div>

      {/* Suggested Starter Chips */}
      {messages.length <= 2 && (
        <div className="space-y-1.5 pt-1">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" /> Suggested Research Topics
          </div>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_PROMPTS.map((promptText, idx) => (
              <button
                key={idx}
                onClick={() => sendMessage(promptText)}
                className="text-xs text-left p-2 rounded-lg bg-card hover:bg-secondary border border-border/80 hover:border-blue-500/40 text-muted-foreground hover:text-foreground transition-all"
              >
                "{promptText}"
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shrink-0 text-blue-400">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 shadow-sm space-y-2 ${
                msg.role === "user"
                  ? "bg-blue-600 text-white rounded-tr-none"
                  : "bg-card border border-border text-foreground rounded-tl-none"
              }`}
            >
              <div className="prose prose-invert prose-sm max-w-none text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                {msg.content}
              </div>

              {/* Source citations box if present */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="pt-3 mt-2 border-t border-border/60 space-y-1.5">
                  <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1">
                    <BookOpen className="w-3 h-3 text-blue-400" /> Research Citations & Sources
                  </div>
                  {msg.sources.map((src, sIdx) => (
                    <a
                      key={sIdx}
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-2 rounded-lg bg-secondary/50 hover:bg-secondary border border-border/60 transition-colors text-left"
                    >
                      <div className="flex items-center justify-between text-xs font-semibold text-blue-400">
                        <span className="truncate">{src.title}</span>
                        <ExternalLink className="w-3 h-3 shrink-0 ml-1 opacity-70" />
                      </div>
                      {src.snippet && (
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                          "{src.snippet}"
                        </p>
                      )}
                    </a>
                  ))}
                </div>
              )}

              <div className="text-[10px] text-muted-foreground/60 text-right">
                {msg.timestamp}
              </div>
            </div>

            {msg.role === "user" && (
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0 text-foreground">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 justify-start items-center">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shrink-0 text-blue-400">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-3 rounded-2xl bg-card border border-border text-xs text-muted-foreground flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
              Consulting sports science literature & peer-reviewed papers...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(input);
        }}
        className="pt-2 border-t border-border flex gap-2"
      >
        <Input
          placeholder="Ask a scientific question (e.g. 'What rest time for squats?', 'How much weekly volume for chest?')..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
          className="bg-card border-border h-11 text-sm focus-visible:ring-blue-500"
        />
        <Button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="h-11 px-5 bg-blue-600 hover:bg-blue-700 text-white font-semibold shrink-0"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Send className="w-4 h-4 mr-1.5" /> Send
            </>
          )}
        </Button>
      </form>
    </div>
  );
}

export default function AIPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading AI Coach...</div>}>
      <AICoachChat />
    </Suspense>
  );
}
