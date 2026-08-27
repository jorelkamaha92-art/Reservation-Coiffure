import { format, parseISO, isValid, addMinutes } from 'date-fns';
import { fr } from 'date-fns/locale';

export const formatDateFr = (dateStr: string | Date, pattern: string = 'dd MMMM yyyy'): string => {
  try {
    const d = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
    if (!isValid(d)) return '';
    return format(d, pattern, { locale: fr });
  } catch {
    return '';
  }
};

export const formatTimeFr = (timeStr: string): string => {
  if (!timeStr) return '';
  return timeStr.slice(0, 5); // "09:30:00" -> "09:30"
};

export const calculateEndTime = (startTime: string, durationMinutes: number): string => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const baseDate = new Date(2000, 0, 1, hours, minutes);
  const endDate = addMinutes(baseDate, durationMinutes);
  return format(endDate, 'HH:mm');
};
