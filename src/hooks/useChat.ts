import { useState, useCallback } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Message } from '../types';

export function useChat(apiKey: string, systemInstruction: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || !apiKey) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey });
      const chat = ai.chats.create({
        model: "gemini-3-flash-preview",
        config: { systemInstruction },
      });

      const response = await chat.sendMessage({ message: text });
      const modelMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: response.text || "Sorry, I couldn't process that.",
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, modelMessage]);
      return modelMessage;
    } catch (error) {
      console.error("Chat Error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, systemInstruction]);

  return { messages, setMessages, sendMessage, isLoading };
}
