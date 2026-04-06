import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  UserPlus,
  Loader2,
  Shield,
  GraduationCap,
  Trash2,
  RefreshCcw,
  Save,
} from 'lucide-react';

type Role = 'aluno' | 'professor' | 'admin';

type Usuario = {
  id: string;
  nome: string;
  email: string;
  role: Role;
};

export default function AdminUsuarios() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('aluno');
  const [loading, setLoading] = useState(false);

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [editedRoles, setEditedRoles] = useState<Record<string, Role>>({});
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const limpar = () => {
    setNome('');
    setEmail('');
    setPassword('');
    setRole('aluno');
  };

  const buscarUsuarios = async () => {
    try {
      setLoadingUsuarios(true);

      const { data, error } = await supabase
        .from('profiles')
        .select('id, nome, email, role')
        .order('nome', { ascending: true });

      if (error) {
        console.error('Erro ao buscar usuários:', error);
        toast.error(error.message || 'Erro ao buscar usuários.');
        return;
      }

      const lista = (data || []) as Usuario[];
      setUsuarios(lista);

      const rolesMap: Record<string, Role> = {};
      lista.forEach((u) => {
        rolesMap[u.id] = u.role;
      });
      setEditedRoles(rolesMap);
    } catch (error) {
      console.error(error);
      toast.error('Erro inesperado ao buscar usuários.');
    } finally {
      setLoadingUsuarios(false);
    }
  };

  useEffect(() => {
    buscarUsuarios();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome.trim() || !email.trim() || !password.trim() || !role) {
      toast.error('Preencha todos os campos.');
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          nome: nome.trim(),
          email: email.trim().toLowerCase(),
          password: password.trim(),
          role,
        },
      });

      if (error) {
        console.error('Erro ao criar usuário:', error);
        toast.error(error.message || 'Erro ao criar usuário.');
        return;
      }

      if (!data?.success) {
        toast.error(data?.error || 'Não foi possível criar o usuário.');
        return;
      }

      toast.success('Usuário criado com sucesso.');
      limpar();
      await buscarUsuarios();
    } catch (error) {
      console.error(error);
      toast.error('Erro inesperado ao criar usuário.');
    } finally {
      setLoading(false);
    }
  };

  const atualizarRole = async (userId: string) => {
    const newRole = editedRoles[userId];

    if (!newRole) {
      toast.error('Role inválida.');
      return;
    }

    const usuarioAtual = usuarios.find((u) => u.id === userId);
    if (!usuarioAtual) {
      toast.error('Usuário não encontrado.');
      return;
    }

    if (usuarioAtual.role === newRole) {
      toast.message('Nenhuma alteração para salvar.');
      return;
    }

    try {
      setSavingId(userId);

      console.log('Atualizando usuário:', userId, 'para role:', newRole);

      const { data, error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId)
        .select('id, nome, email, role');

      console.log('Retorno update:', { data, error });

      if (error) {
        console.error('Erro ao atualizar role:', error);
        toast.error(error.message || 'Erro ao atualizar role.');
        return;
      }

      if (!data || data.length === 0) {
        toast.error('A role não foi atualizada. Verifique a policy do Supabase.');
        await buscarUsuarios();
        return;
      }

      const usuarioAtualizado = data[0] as Usuario;

      setUsuarios((prev) =>
        prev.map((u) => (u.id === userId ? usuarioAtualizado : u))
      );

      setEditedRoles((prev) => ({
        ...prev,
        [userId]: usuarioAtualizado.role,
      }));

      toast.success('Role atualizada com sucesso.');
      await buscarUsuarios();
    } catch (error) {
      console.error(error);
      toast.error('Erro inesperado ao atualizar role.');
      await buscarUsuarios();
    } finally {
      setSavingId(null);
    }
  };

  const excluirUsuario = async (userId: string) => {
    const confirmou = window.confirm(
      'Tem certeza que deseja excluir este usuário? Essa ação não pode ser desfeita.'
    );

    if (!confirmou) return;

    try {
      setDeletingId(userId);

      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId },
      });

      if (error) {
        console.error('Erro ao excluir usuário:', error);
        toast.error(error.message || 'Erro ao excluir usuário.');
        return;
      }

      if (!data?.success) {
        toast.error(data?.error || 'Não foi possível excluir o usuário.');
        return;
      }

      setUsuarios((prev) => prev.filter((u) => u.id !== userId));
      setEditedRoles((prev) => {
        const novo = { ...prev };
        delete novo[userId];
        return novo;
      });

      toast.success('Usuário excluído com sucesso.');
    } catch (error) {
      console.error(error);
      toast.error('Erro inesperado ao excluir usuário.');
    } finally {
      setDeletingId(null);
    }
  };

  const roleIcon =
    role === 'admin' ? (
      <Shield className="w-4 h-4" />
    ) : role === 'professor' ? (
      <UserPlus className="w-4 h-4" />
    ) : (
      <GraduationCap className="w-4 h-4" />
    );

  return (
    <DashboardLayout title="Cadastro de Usuários">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <UserPlus className="w-6 h-6 text-[#1B2A6B]" />
            <h2 className="text-2xl font-bold text-[#1B2A6B]">
              Cadastrar usuário
            </h2>
          </div>

          <p className="text-gray-500 mb-6">
            Crie alunos, instrutores ou administradores com acesso imediato ao sistema.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Nome completo"
              />
            </div>

            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@exemplo.com"
              />
            </div>

            <div>
              <Label htmlFor="password">Senha provisória</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div>
              <Label>Tipo de usuário</Label>
              <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aluno">Aluno</SelectItem>
                  <SelectItem value="professor">Professor</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>

          

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1B2A6B] hover:bg-[#0D1B3E] text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Criando usuário...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Criar usuário
                </>
              )}
            </Button>
          </form>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4 gap-3">
            <div>
              <h2 className="text-2xl font-bold text-[#1B2A6B]">
                Usuários cadastrados
              </h2>
              <p className="text-gray-500 text-sm">
                Edite a role dos usuários ou exclua contas do sistema.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={buscarUsuarios}
              disabled={loadingUsuarios}
            >
              {loadingUsuarios ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCcw className="w-4 h-4" />
              )}
            </Button>
          </div>

          <div className="space-y-3">
            {loadingUsuarios ? (
              <div className="py-10 flex items-center justify-center text-gray-500">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Carregando usuários...
              </div>
            ) : usuarios.length === 0 ? (
              <div className="py-10 text-center text-gray-500">
                Nenhum usuário encontrado.
              </div>
            ) : (
              usuarios.map((usuario) => {
                const selectedRole = editedRoles[usuario.id] || usuario.role;
                const mudouRole = selectedRole !== usuario.role;

                return (
                  <div
                    key={usuario.id}
                    className="border border-gray-100 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                  >
                    <div>
                      <p className="font-semibold text-[#1B2A6B]">{usuario.nome}</p>
                      <p className="text-sm text-gray-500">{usuario.email}</p>
                      <p className="text-xs text-gray-400 mt-1">ID: {usuario.id}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Role atual no banco: {usuario.role}
                      </p>
                    </div>

                    <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                      <Select
                        value={selectedRole}
                        onValueChange={(v) =>
                          setEditedRoles((prev) => ({
                            ...prev,
                            [usuario.id]: v as Role,
                          }))
                        }
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="aluno">Aluno</SelectItem>
                          <SelectItem value="professor">Professor</SelectItem>
                          <SelectItem value="admin">Administrador</SelectItem>
                        </SelectContent>
                      </Select>

                      <Button
                        type="button"
                        onClick={() => atualizarRole(usuario.id)}
                        disabled={savingId === usuario.id || !mudouRole}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
                      >
                        {savingId === usuario.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Salvar
                          </>
                        )}
                      </Button>

                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => excluirUsuario(usuario.id)}
                        disabled={deletingId === usuario.id}
                      >
                        {deletingId === usuario.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}