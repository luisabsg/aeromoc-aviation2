import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Generate time slots from 05:00 to 17:00 in 30-minute intervals */
export function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let h = 5; h <= 17; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`);
    if (h < 17) slots.push(`${String(h).padStart(2, '0')}:30`);
  }
  return slots;
}

export type StatusType = 'aguardando' | 'aceito' | 'recusado';

export function statusLabel(status: StatusType): string {
  const map: Record<StatusType, string> = {
    aguardando: 'Aguardando',
    aceito: 'Aceito',
    recusado: 'Recusado',
  };
  return map[status] ?? status;
}

export function statusColor(status: StatusType): string {
  const map: Record<StatusType, string> = {
    aguardando: 'bg-amber-100 text-amber-800 border-amber-300',
    aceito: 'bg-green-100 text-green-800 border-green-300',
    recusado: 'bg-red-100 text-red-800 border-red-300',
  };
  return map[status] ?? 'bg-gray-100 text-gray-700';
}

export function statusDot(status: StatusType): string {
  const map: Record<StatusType, string> = {
    aguardando: 'bg-amber-400',
    aceito: 'bg-green-500',
    recusado: 'bg-red-500',
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
