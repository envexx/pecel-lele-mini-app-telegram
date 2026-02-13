import TelegramBot from 'node-telegram-bot-api';
import { formatRupiah } from '../utils/helpers';

let bot: TelegramBot | null = null;

const KITCHEN_CHAT_ID = process.env.TELEGRAM_KITCHEN_CHAT_ID || '';
const KASIR_CHAT_ID = process.env.TELEGRAM_KASIR_CHAT_ID || '';

export function initTelegramBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.warn('TELEGRAM_BOT_TOKEN not set. Telegram notifications disabled.');
    return;
  }

  bot = new TelegramBot(token, { polling: false });
  console.log('Telegram bot initialized.');
}

export async function notifyKitchenNewOrder(order: {
  order_number: number;
  order_type: string;
  table_number?: number;
  customer_name?: string;
  items: { name: string; quantity: number }[];
  notes?: string;
}) {
  if (!bot || !KITCHEN_CHAT_ID) return;

  const location = order.order_type === 'dine-in'
    ? `📍 Meja ${order.table_number}`
    : '📍 Online/Takeaway';

  const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  let message = `🔔 *PESANAN BARU! #${order.order_number}*\n\n`;
  message += `${location} | ⏰ ${time}\n`;

  if (order.customer_name) {
    message += `👤 ${order.customer_name}\n`;
  }

  message += `\n📋 *Pesanan:*\n`;
  for (const item of order.items) {
    message += `• ${item.quantity}x ${item.name}\n`;
  }

  if (order.notes) {
    message += `\n📝 Catatan: ${order.notes}`;
  }

  try {
    await bot.sendMessage(KITCHEN_CHAT_ID, message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Failed to send kitchen notification:', error);
  }
}

export async function notifyKitchenOrderUpdated(order: {
  order_number: number;
  table_number?: number;
  items: { name: string; quantity: number }[];
  notes?: string;
}) {
  if (!bot || !KITCHEN_CHAT_ID) return;

  let message = `✏️ *PESANAN DIUPDATE! #${order.order_number}*\n\n`;

  if (order.table_number) {
    message += `📍 Meja ${order.table_number}\n`;
  }

  message += `\n📋 *Pesanan terbaru:*\n`;
  for (const item of order.items) {
    message += `• ${item.quantity}x ${item.name}\n`;
  }

  if (order.notes) {
    message += `\n📝 Catatan: ${order.notes}`;
  }

  try {
    await bot.sendMessage(KITCHEN_CHAT_ID, message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Failed to send kitchen update notification:', error);
  }
}

export async function notifyKasirOrderReady(order: {
  order_number: number;
  order_type: string;
  table_number?: number;
  total_amount: number;
}) {
  if (!bot || !KASIR_CHAT_ID) return;

  const location = order.order_type === 'dine-in'
    ? `📍 Meja ${order.table_number}`
    : '📍 Online/Takeaway';

  let message = `✅ *Pesanan Siap! #${order.order_number}*\n\n`;
  message += `${location}\n`;
  message += `Pesanan sudah siap disajikan\n`;
  message += `Total: ${formatRupiah(order.total_amount)}`;

  try {
    await bot.sendMessage(KASIR_CHAT_ID, message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Failed to send kasir notification:', error);
  }
}
