import { parseISO, addDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function formatarDataComDateFns(dataStr: string, days = 0) 
{
    const data = parseISO(dataStr);

    if (days > 0)
    {
        const dataAdd = addDays(data, days);
        return format(dataAdd, 'dd/MM/yyyy', { locale: ptBR });
    }

    return format(data, 'dd/MM/yyyy', { locale: ptBR });
}