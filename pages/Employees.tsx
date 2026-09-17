import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Employee {
  id: string;
  name: string;
  role: string;
  email: string | null;
  phone: string | null;
  pin_code: string | null;
  status: 'Active' | 'Inactive' | string;
  notes?: string | null;
}

const Employees: React.FC = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('Caixa');
  const [pinCode, setPinCode] = useState('');
  const [status, setStatus] = useState('Active');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modal Novo Colaborador
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setEmployees(data || []);
      if (data && data.length > 0 && !selectedEmployee) {
        selectEmployee(data[0]);
      }
    } catch (err: any) {
      console.error('Erro ao buscar funcionários:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectEmployee = (emp: Employee) => {
    setSelectedEmployee(emp);
    setName(emp.name || '');
    setEmail(emp.email || '');
    setPhone(emp.phone || '');
    setRole(emp.role || 'Caixa');
    setPinCode(emp.pin_code || '');
    setStatus(emp.status || 'Active');
    setMessage(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    if (pinCode && (pinCode.length < 4 || !/^\d+$/.test(pinCode))) {
      setMessage({ text: 'O PIN deve conter no mínimo 4 dígitos numéricos.', type: 'error' });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const { error } = await supabase
        .from('employees')
        .update({
          name: name.trim(),
          email: email.trim() || null,
          phone: phone.trim() || null,
          role,
          pin_code: pinCode.trim() || null,
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedEmployee.id);

      if (error) throw error;

      setMessage({ text: 'Colaborador atualizado com sucesso!', type: 'success' });
      loadEmployees();
    } catch (err: any) {
      setMessage({ text: err.message || 'Erro ao salvar alterações.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateEmployee = async (newEmp: {
    name: string;
    email: string;
    role: string;
    pin_code: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .insert({
          name: newEmp.name.trim(),
          email: newEmp.email.trim() || null,
          role: newEmp.role,
          pin_code: newEmp.pin_code.trim(),
          status: 'Active',
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      setIsNewModalOpen(false);
      await loadEmployees();
      if (data) selectEmployee(data);
    } catch (err: any) {
      alert(`Erro ao cadastrar funcionário: ${err.message}`);
    }
  };

  const filteredEmployees = employees.filter((emp) =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="p-6 lg:p-8 h-full overflow-y-auto">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Header */}
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div>
              <h1 className="text-3xl font-black text-gray-900 dark:text-white font-display tracking-tight">
                Gestão de Funcionários & Perfis
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Controle de equipe, permissões de acesso e PINs de autenticação no terminal.
              </p>
            </div>
            <button
              onClick={() => setIsNewModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-gray-900 dark:text-black text-xs font-bold hover:opacity-90 transition-opacity shadow-sm"
            >
              <span className="material-symbols-outlined text-base">person_add</span>
              Novo Colaborador
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Lista Lateral de Funcionários */}
            <div className="lg:col-span-1 space-y-3">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400 text-lg">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Buscar colaborador ou cargo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 text-xs text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary shadow-sm"
                />
              </div>

              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {loading ? (
                  <div className="p-8 text-center text-xs text-gray-500">
                    Carregando colaboradores...
                  </div>
                ) : filteredEmployees.length === 0 ? (
                  <div className="p-8 text-center text-xs text-gray-400 bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-white/10">
                    Nenhum colaborador encontrado.
                  </div>
                ) : (
                  filteredEmployees.map((emp) => {
                    const isSelected = selectedEmployee?.id === emp.id;
                    return (
                      <div
                        key={emp.id}
                        onClick={() => selectEmployee(emp)}
                        className={`p-3.5 rounded-2xl cursor-pointer transition-all border ${
                          isSelected
                            ? 'bg-primary/10 border-primary shadow-sm dark:bg-primary/20'
                            : 'bg-white dark:bg-surface-dark border-gray-200/80 dark:border-white/10 hover:border-gray-300'
                        } flex items-center justify-between`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-sm">
                            {emp.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-900 dark:text-white">
                              {emp.name}
                            </p>
                            <span className="inline-block text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                              {emp.role}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              emp.status === 'Active'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                            }`}
                          >
                            {emp.status === 'Active' ? 'Ativo' : 'Inativo'}
                          </span>
                          {emp.pin_code && (
                            <span className="block text-[9px] text-gray-400 mt-1 font-mono">
                              PIN: ••••
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Painel de Edição de Detalhes */}
            <div className="lg:col-span-2 bg-white dark:bg-surface-dark p-6 rounded-2xl border border-gray-200/80 dark:border-white/10 shadow-sm">
              {selectedEmployee ? (
                <form onSubmit={handleSave} className="space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-white/5">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white font-display">
                        Ficha do Colaborador
                      </h2>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Configuração de acesso e permissões no sistema
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                        Status:
                      </label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="text-xs font-bold px-2.5 py-1 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 text-gray-900 dark:text-white outline-none"
                      >
                        <option value="Active">Ativo</option>
                        <option value="Inactive">Inativo</option>
                      </select>
                    </div>
                  </div>

                  {message && (
                    <div
                      className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                        message.type === 'success'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}
                    >
                      <span className="material-symbols-outlined text-base">
                        {message.type === 'success' ? 'check_circle' : 'error'}
                      </span>
                      <span>{message.text}</span>
                    </div>
                  )}

                  {/* Informações Básicas */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Nome Completo *
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary font-medium"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        E-mail
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Telefone / WhatsApp
                      </label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="(11) 99999-9999"
                        className="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        PIN de Acesso no Terminal (4 dígitos) *
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={pinCode}
                        onChange={(e) => setPinCode(e.target.value)}
                        placeholder="Ex: 1234"
                        className="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary font-mono font-bold tracking-widest"
                      />
                    </div>
                  </div>

                  {/* Nível de Acesso e Cargo */}
                  <div className="p-4 rounded-2xl bg-gray-50 dark:bg-black/20 border border-gray-200/80 dark:border-white/5 space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                      Perfil e Permissões Operacionais
                    </h3>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                        Cargo no Sistema
                      </label>
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="Caixa">Caixa (Frente de Loja, Vendas e Recebimentos)</option>
                        <option value="Produção">Produção (Fábrica, Receitas, Lotes e Insumos)</option>
                        <option value="Gerente">Gerente (Operação completa sem configurações avançadas)</option>
                        <option value="Administrador">Administrador Geral (Acesso Irrestrito)</option>
                      </select>
                    </div>

                    <div className="pt-2 text-[11px] text-gray-500 space-y-1">
                      {role === 'Caixa' && (
                        <p>✓ Acesso a Frente de Caixa (PDV), Sangria/Suprimento e Consulta de Produtos.</p>
                      )}
                      {role === 'Produção' && (
                        <p>✓ Acesso a Fabricação (PCP), Fichas Técnicas/Receitas, Estoque de Insumos e Cubas.</p>
                      )}
                      {(role === 'Administrador' || role === 'Gerente') && (
                        <p>✓ Acesso total: Relatórios financeiros, Análise de Custos, Auditoria e Configurações.</p>
                      )}
                    </div>
                  </div>

                  {/* Botões de Ação */}
                  <div className="pt-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-end gap-3">
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-6 py-2.5 rounded-xl bg-primary text-gray-900 dark:text-black text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2 shadow-sm"
                    >
                      {saving ? (
                        <span className="size-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-base">save</span>
                          Salvar Alterações
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-12 text-center text-xs text-gray-400">
                  Selecione um colaborador na lista ao lado para gerenciar permissões.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Criar Colaborador */}
      {isNewModalOpen && (
        <CreateEmployeeModal
          isOpen={isNewModalOpen}
          onClose={() => setIsNewModalOpen(false)}
          onCreate={handleCreateEmployee}
        />
      )}
    </Layout>
  );
};

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (emp: { name: string; email: string; role: string; pin_code: string }) => void;
}

const CreateEmployeeModal: React.FC<CreateModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Caixa');
  const [pin, setPin] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || pin.length < 4) {
      alert('Preencha o nome e um PIN de 4 dígitos.');
      return;
    }
    onCreate({ name, email, role, pin_code: pin });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-white/5 mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white font-display">
            Novo Colaborador
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Nome Completo *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: João Mestre Gelatiere"
              className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary font-medium"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="joao@gelato.com"
              className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary font-medium"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Cargo / Perfil de Acesso *
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="Caixa">Caixa (Vendas / PDV)</option>
              <option value="Produção">Produção (Fábrica / Insumos / Lotes)</option>
              <option value="Gerente">Gerente</option>
              <option value="Administrador">Administrador Geral</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Código PIN (4 dígitos) *
            </label>
            <input
              type="text"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Ex: 4321"
              className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white font-mono font-bold tracking-widest outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 font-bold text-gray-600 hover:bg-gray-100 dark:hover:bg-white/5"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-primary text-gray-900 font-bold hover:opacity-90 shadow-sm"
            >
              Cadastrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Employees;
