import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, Bot, User, Bell, Droplets, Utensils, X, Check, ShieldCheck, ChevronRight } from 'lucide-react';
import { api } from '../../services/api';
import { useCart } from '../../contexts/CartContext';

interface AICustomerBotProps {
  restaurantSlug: string;
  tableNumber?: string;
  orderId?: string;
  isOpen: boolean;
  onClose: () => void;
  onItemSelect?: (item: any) => void;
}

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  suggested_items?: Array<{ id: string; name: string; price: number; image?: string }>;
  quick_chips?: string[];
  actionTaken?: string;
}

export const AICustomerBot: React.FC<AICustomerBotProps> = ({
  restaurantSlug,
  tableNumber = 'Table 1',
  orderId,
  isOpen,
  onClose,
  onItemSelect,
}) => {
  const { addItem } = useCart();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      sender: 'ai',
      text: `Namaste & Welcome to **Tejas**! ✨\n\nI am your AI Dining Concierge. How may I assist you at **${tableNumber}** today? I can recommend signature pairings, guide you through spices & allergens, track your dishes, or summon your table server.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      quick_chips: [
        '🌟 Chef Recommendations',
        '🥗 Pure Veg Specials',
        '🍗 Signature Kebabs',
        '🔔 Call Server to Table',
        '💧 Request Water',
      ],
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsTyping(true);

    try {
      const response = await api.askAIAssistant(restaurantSlug, {
        prompt: text,
        table_number: tableNumber,
        order_id: orderId,
      });

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggested_items: response.suggested_items,
        quick_chips: response.quick_chips,
        actionTaken: response.action_taken,
      };

      setMessages((prev) => [...prev, aiMsg]);

      if (response.action_taken === 'WAITER_CALLED') {
        setNotificationMsg(`Floor team alerted for ${tableNumber}! A server is on their way.`);
        setTimeout(() => setNotificationMsg(null), 4000);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'ai',
          text: "I'm having a brief connection flutter, but our floor staff at Tejas is always right next to you! Would you like me to ping your table waiter?",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          quick_chips: ['🔔 Call Server to Table', 'Browse Menu'],
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickAdd = (item: { id: string; name: string; price: number; image?: string }) => {
    addItem({
      menu_item_id: item.id,
      name: item.name,
      base_price: item.price,
      unit_price: item.price,
      quantity: 1,
      addons: [],
      image_url: item.image,
    });
    setNotificationMsg(`Added ${item.name} to cart!`);
    setTimeout(() => setNotificationMsg(null), 3000);
  };

  const handleQuickWaiterAction = async (type: string) => {
    try {
      await api.callWaiter(restaurantSlug, {
        table_number: tableNumber,
        request_type: type,
        notes: `Quick action: ${type}`,
      });
      setNotificationMsg(`Staff notified for ${tableNumber} (${type})!`);
      setTimeout(() => setNotificationMsg(null), 3500);

      setMessages((prev) => [
        ...prev,
        {
          id: `sys-${Date.now()}`,
          sender: 'ai',
          text: `🔔 Server has been notified for **${tableNumber}** regarding **${type}**!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          quick_chips: ['Check Order Status', 'Explore Desserts', 'Pay Bill'],
        },
      ]);
    } catch {
      setNotificationMsg('Staff notified.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full sm:max-w-md h-[88vh] sm:h-[650px] bg-gradient-to-b from-slate-900 via-charcoal-900 to-black text-white rounded-t-3xl sm:rounded-3xl border border-amber-500/20 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-yellow-600 p-4 flex items-center justify-between text-white shadow-md flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
              <Sparkles className="w-5 h-5 text-amber-200 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-serif font-bold text-base tracking-wide">Tejas AI Concierge</h3>
                <span className="text-[10px] bg-emerald-400/20 text-emerald-300 font-semibold px-2 py-0.5 rounded-full border border-emerald-400/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Live Desk
                </span>
              </div>
              <p className="text-[11px] text-amber-100 flex items-center gap-1">
                <span>Serving {tableNumber}</span>
                <span>•</span>
                <span>Customer Assistance Bot</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Floor Action Shortcuts Bar */}
        <div className="bg-slate-950/90 border-b border-amber-500/10 px-3 py-2 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar text-xs">
          <button
            onClick={() => handleQuickWaiterAction('WATER')}
            className="flex-shrink-0 flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-sky-300 font-medium transition-all active:scale-95"
          >
            <Droplets className="w-3.5 h-3.5 text-sky-400" />
            <span>Water</span>
          </button>
          <button
            onClick={() => handleQuickWaiterAction('SERVER')}
            className="flex-shrink-0 flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-900/40 hover:bg-amber-800/60 border border-amber-600/40 text-amber-300 font-medium transition-all active:scale-95"
          >
            <Bell className="w-3.5 h-3.5 text-amber-400" />
            <span>Call Waiter</span>
          </button>
          <button
            onClick={() => handleQuickWaiterAction('CUTLERY')}
            className="flex-shrink-0 flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-emerald-300 font-medium transition-all active:scale-95"
          >
            <Utensils className="w-3.5 h-3.5 text-emerald-400" />
            <span>Cutlery</span>
          </button>
          <button
            onClick={() => handleSendMessage('How can I pay my bill on my phone?')}
            className="flex-shrink-0 flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-purple-900/30 hover:bg-purple-800/50 border border-purple-500/30 text-purple-300 font-medium transition-all active:scale-95"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            <span>Pay Bill</span>
          </button>
        </div>

        {/* Floating In-App Toast */}
        {notificationMsg && (
          <div className="bg-emerald-600 text-white text-xs px-4 py-2 font-medium flex items-center justify-between animate-slide-down">
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              {notificationMsg}
            </span>
          </div>
        )}

        {/* Chat Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 no-scrollbar">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-soft ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-br-none'
                    : 'bg-slate-800/90 text-slate-100 border border-amber-500/15 rounded-bl-none'
                }`}
              >
                <div className="whitespace-pre-line font-sans">{msg.text}</div>

                {/* Suggested Dish Cards inside bot message */}
                {msg.suggested_items && msg.suggested_items.length > 0 && (
                  <div className="mt-3 space-y-2 pt-2 border-t border-slate-700/60">
                    <p className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">
                      Chef Suggestions
                    </p>
                    <div className="space-y-1.5">
                      {msg.suggested_items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-slate-900/70 border border-slate-700/50 hover:border-amber-500/40 transition-colors"
                        >
                          <div className="flex items-center space-x-2.5">
                            {item.image && (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-9 h-9 rounded-lg object-cover"
                              />
                            )}
                            <div>
                              <p className="text-xs font-semibold text-white">{item.name}</p>
                              <p className="text-[11px] text-amber-400 font-mono">₹{item.price}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleQuickAdd(item)}
                            className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-bold tracking-wide active:scale-95 transition-all"
                          >
                            + Add
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-1 text-[10px] text-slate-400 text-right">{msg.timestamp}</div>
              </div>

              {/* Bot Quick Suggestion Chips */}
              {msg.quick_chips && msg.quick_chips.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2 max-w-[90%]">
                  {msg.quick_chips.map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(chip)}
                      className="text-[11px] px-3 py-1 rounded-full bg-slate-800/80 hover:bg-amber-700/60 border border-amber-500/20 text-amber-200 transition-all active:scale-95"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center space-x-2 text-slate-400 text-xs italic">
              <Bot className="w-4 h-4 text-amber-400 animate-bounce" />
              <span>Chef Tejas AI is concocting a response...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-slate-950/90 border-t border-amber-500/15 flex-shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              placeholder="Ask anything (e.g. non-spicy veg dish, call waiter)..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 bg-slate-800/90 text-white placeholder:text-slate-400 text-xs rounded-xl px-3.5 py-2.5 border border-slate-700 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="w-10 h-10 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 disabled:opacity-40 text-white flex items-center justify-center transition-all active:scale-95 shadow-md flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
