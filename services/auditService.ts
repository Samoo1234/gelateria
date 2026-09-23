import { supabase } from '../lib/supabase';

export interface AuditLogItem {
  id: string;
  action: string;
  entity: string;
  entity_id: string;
  employee_id?: string | null;
  terminal_id?: string | null;
  details: any;
  created_at: string;
  employees?: {
    name: string;
    role?: string;
  };
}

export interface AuditFilters {
  startDate?: string;
  endDate?: string;
  action?: string;
  employeeId?: string;
  entity?: string;
}

export const auditService = {
  /**
   * Consulta os logs de auditoria com filtros operacionais (Etapa 16)
   */
  async getAuditLogs(filters?: AuditFilters, limit: number = 100): Promise<AuditLogItem[]> {
    let query = supabase
      .from('audit_logs')
      .select(`
        *,
        employees:employee_id(name, role)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (filters?.action) {
      query = query.eq('action', filters.action);
    }
    if (filters?.employeeId) {
      query = query.eq('employee_id', filters.employeeId);
    }
    if (filters?.entity) {
      query = query.eq('entity', filters.entity);
    }
    if (filters?.startDate) {
      query = query.gte('created_at', `${filters.startDate}T00:00:00.000Z`);
    }
    if (filters?.endDate) {
      query = query.lte('created_at', `${filters.endDate}T23:59:59.999Z`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao consultar logs de auditoria:', error);
      return [];
    }

    return data || [];
  },

  /**
   * Registra evento manual de auditoria (ex: PESO MANUAL, LOGIN, etc)
   */
  async recordAuditLog(
    action: string,
    entity: string,
    entityId: string,
    details: Record<string, any>,
    employeeId?: string | null
  ) {
    const { data, error } = await supabase
      .from('audit_logs')
      .insert({
        action,
        entity,
        entity_id: entityId,
        details,
        employee_id: employeeId || null
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao registrar audit log:', error);
      return null;
    }

    return data;
  },

  /**
   * Registra evento de segurança no log de auditoria
   */
  async logSecurityEvent(
    action: string,
    entity: string,
    entityId: string,
    details: Record<string, any>,
    employeeId?: string | null
  ) {
    return this.recordAuditLog(action, entity, entityId, details, employeeId);
  }
};
