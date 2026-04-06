import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Generate time slots from 05:00 to 17:00 in 30-minute intervals */
export function generateTimeSlots(): string[] {
  const slots: string[] = [];

  let totalMinutes = 5 * 60;   // 05:00
  const endMinutes = 17 * 60;  // 17:00

  while (totalMinutes <= endMinutes) {
    const hour = Math.floor(totalMinutes / 60);
    const minute = totalMinutes % 60;

    slots.push(
      `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
    );

    totalMinutes += 90; // 1h30
  }

  return slots;
}

export type StatusType =
  | 'pendente'
  | 'confirmado'
  | 'recusado'
  | 'cancelado'
  | 'realizado';

export function statusLabel(status: StatusType): string {
  const map: Record<StatusType, string> = {
    pendente: 'Pendente',
    confirmado: 'Confirmado',
    recusado: 'Recusado',
    cancelado: 'Cancelado',
    realizado: 'Realizado',
  };
  return map[status] ?? status;
}

export function statusColor(status: StatusType): string {
  const map: Record<StatusType, string> = {
    pendente: 'bg-amber-100 text-amber-800 border-amber-300',
    confirmado: 'bg-green-100 text-green-800 border-green-300',
    recusado: 'bg-red-100 text-red-800 border-red-300',
    cancelado: 'bg-gray-100 text-gray-600 border-gray-300',
    realizado: 'bg-gray-100 text-gray-700 border-gray-300',
  };
  return map[status] ?? 'bg-gray-100 text-gray-700 border-gray-300';
}

export function statusDot(status: StatusType): string {
  const map: Record<StatusType, string> = {
    pendente: 'bg-amber-400',
    confirmado: 'bg-green-500',
    recusado: 'bg-red-500',
    cancelado: 'bg-gray-400',
    realizado: 'bg-gray-500',
  };
  return map[status] ?? 'bg-gray-400';
}

export function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

/** Check if a given time slot overlaps with a blocked period */
export function isTimeBlocked(
  slot: string,
  bloqueioInicio: string,
  bloqueioFim: string
): boolean {
  return slot >= bloqueioInicio && slot < bloqueioFim;
}