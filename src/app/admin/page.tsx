"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

type TabType = "overview" | "users" | "companies" | "posts" | "reports" | "logs";
type UserFilterType = "all" | "USER" | "FOREMAN" | "COMPANY" | "banned" | "silenced";

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Datos del dashboard
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalWorkers: 0,
    totalForemen: 0,
    totalCompanies: 0,
    totalPosts: 0,
    pendingReports: 0,
    pendingVerifications: 0,
    bannedUsers: 0,
    silencedUsers: 0,
  });

  // Verificar si el usuario es admin
  useEffect(() => {
    if (!authLoading && user) {
      fetch(`/api/admin/check?uid=${user.uid}`)
        .then(res => res.json())
        .then(data => {
          if (data.isAdmin) {
            setIsAdmin(true);
            loadStats();
          } else {
            router.push("/");
          }
          setLoading(false);
        })
        .catch(() => {
          router.push("/");
          setLoading(false);
        });
    } else if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const loadStats = async () => {
    const res = await fetch("/api/admin/stats");
    if (res.ok) {
      const data = await res.json();
      // Mapear los nombres de las propiedades de la API a los del estado
      setStats({
        totalUsers: data.totalUsers || 0,
        totalWorkers: data.workers || 0,
        totalForemen: data.foremen || 0,
        totalCompanies: data.totalCompanies || 0,
        totalPosts: data.totalPosts || 0,
        pendingReports: data.pendingReports || 0,
        pendingVerifications: data.pendingVerifications || 0,
        bannedUsers: data.bannedUsers || 0,
        silencedUsers: data.silencedUsers || 0,
      });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header Admin */}
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-red-500">Panel de Administración</h1>
            <span className="text-gray-400">|</span>
            <span className="text-sm text-gray-400">{user?.email}</span>
          </div>
          <button
            onClick={() => router.push("/")}
            className="text-sm bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded"
          >
            Volver a la App
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto flex">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-800 min-h-screen p-4">
          <nav className="space-y-2">
            <AdminTabButton active={activeTab === "overview"} onClick={() => setActiveTab("overview")}>
              📊 Resumen
            </AdminTabButton>
            <AdminTabButton active={activeTab === "users"} onClick={() => setActiveTab("users")}>
              👥 Usuarios {stats.bannedUsers > 0 && <span className="ml-2 bg-red-600 text-xs px-2 rounded">{stats.bannedUsers}</span>}
            </AdminTabButton>
            <AdminTabButton active={activeTab === "companies"} onClick={() => setActiveTab("companies")}>
              🏢 Empresas {stats.pendingVerifications > 0 && <span className="ml-2 bg-yellow-600 text-xs px-2 rounded">{stats.pendingVerifications}</span>}
            </AdminTabButton>
            <AdminTabButton active={activeTab === "posts"} onClick={() => setActiveTab("posts")}>
              📝 Publicaciones
            </AdminTabButton>
            <AdminTabButton active={activeTab === "reports"} onClick={() => setActiveTab("reports")}>
              🚨 Denuncias {stats.pendingReports > 0 && <span className="ml-2 bg-red-600 text-xs px-2 rounded">{stats.pendingReports}</span>}
            </AdminTabButton>
            <AdminTabButton active={activeTab === "logs"} onClick={() => setActiveTab("logs")}>
              📋 Historial
            </AdminTabButton>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {activeTab === "overview" && <AdminOverview stats={stats} />}
          {activeTab === "users" && <AdminUsers onStatsUpdate={loadStats} adminId={user?.uid} />}
          {activeTab === "companies" && <AdminCompanies onStatsUpdate={loadStats} adminId={user?.uid} />}
          {activeTab === "posts" && <AdminPosts adminId={user?.uid} onStatsUpdate={loadStats} />}
          {activeTab === "reports" && <AdminReports onStatsUpdate={loadStats} adminId={user?.uid} />}
          {activeTab === "logs" && <AdminLogs />}
        </main>
      </div>
    </div>
  );
}

function AdminTabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-2 rounded-lg transition flex items-center ${
        active ? "bg-red-600 text-white" : "text-gray-300 hover:bg-gray-700"
      }`}
    >
      {children}
    </button>
  );
}

function AdminOverview({ stats }: { stats: any }) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Resumen del Sistema</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Usuarios" value={stats.totalUsers} icon="👥" color="bg-blue-600" />
        <StatCard title="Trabajadores" value={stats.totalWorkers} icon="👨‍🌾" color="bg-green-600" />
        <StatCard title="Manijeros" value={stats.totalForemen} icon="📋" color="bg-orange-600" />
        <StatCard title="Empresas" value={stats.totalCompanies} icon="🏢" color="bg-purple-600" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Publicaciones" value={stats.totalPosts} icon="📝" color="bg-teal-600" />
        <StatCard title="Denuncias Pendientes" value={stats.pendingReports} icon="🚨" color="bg-red-600" />
        <StatCard title="Verificaciones Pendientes" value={stats.pendingVerifications} icon="⏳" color="bg-yellow-600" />
        <StatCard title="Usuarios Sancionados" value={stats.bannedUsers + stats.silencedUsers} icon="🔒" color="bg-gray-600" />
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: number; icon: string; color: string }) {
  return (
    <div className={`${color} rounded-xl p-6`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm opacity-80">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
        </div>
        <span className="text-4xl">{icon}</span>
      </div>
    </div>
  );
}

function AdminUsers({ onStatsUpdate, adminId }: { onStatsUpdate: () => void; adminId?: string }) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<UserFilterType>("all");
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });

  useEffect(() => {
    loadUsers();
  }, [filter, search, pagination.page]);

  const loadUsers = async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/users?filter=${filter}&search=${search}&page=${pagination.page}`);
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users || []);
      if (data.pagination) {
        setPagination({ page: data.pagination.page, totalPages: data.pagination.totalPages });
      }
    }
    setLoading(false);
  };

  const handleBan = async (userId: string, ban: boolean) => {
    const reason = ban ? prompt("Razón del baneo:") : "";
    if (ban && reason === null) return;

    const res = await fetch("/api/admin/users/ban", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ban, reason: ban ? reason : undefined, adminId }),
    });

    if (res.ok) {
      loadUsers();
      onStatsUpdate();
      alert(ban ? "Usuario baneado" : "Usuario desbaneado");
    } else {
      const data = await res.json();
      alert(data.error || "Error al realizar la acción");
    }
  };

  const handleSilence = async (userId: string, silence: boolean) => {
    if (silence) {
      // Mostrar diálogo con opciones de tiempo
      const hours = prompt(
        "Duración del silencio (en horas):\n" +
        "• 24 = 1 día\n" +
        "• 48 = 2 días\n" +
        "• 168 = 1 semana\n" +
        "• 720 = 30 días\n" +
        "• Dejar vacío = permanente"
      );
      if (hours === null) return;

      const hoursNum = hours.trim() === "" ? null : parseInt(hours);
      if (hours !== "" && (hoursNum === null || isNaN(hoursNum))) {
        alert("Por favor, introduce un número válido");
        return;
      }

      const res = await fetch("/api/admin/users/silence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, silence: true, hours: hoursNum, adminId }),
      });

      if (res.ok) {
        loadUsers();
        onStatsUpdate();
        alert("Usuario silenciado");
      } else {
        alert("Error al realizar la acción");
      }
    } else {
      const res = await fetch("/api/admin/users/silence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, silence: false, adminId }),
      });

      if (res.ok) {
        loadUsers();
        alert("Silencio retirado");
      } else {
        alert("Error al realizar la acción");
      }
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    const res = await fetch("/api/admin/users/role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role: newRole, adminId }),
    });

    if (res.ok) {
      loadUsers();
      alert("Rol actualizado");
    } else {
      alert("Error al actualizar rol");
    }
  };

  const getUserName = (u: any) => {
    if (u.workerProfile?.fullName) return u.workerProfile.fullName;
    if (u.foremanProfile?.fullName) return u.foremanProfile.fullName;
    if (u.companyProfile?.companyName) return u.companyProfile.companyName;
    return u.email;
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      ADMIN: "bg-red-600",
      COMPANY: "bg-purple-600",
      FOREMAN: "bg-orange-600",
      USER: "bg-blue-600",
    };
    return colors[role] || "bg-gray-600";
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold">Gestión de Usuarios</h2>

        {/* Filtros */}
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setFilter("all")} className={`px-3 py-1.5 rounded text-sm ${filter === "all" ? "bg-red-600" : "bg-gray-700"}`}>Todos</button>
          <button onClick={() => setFilter("USER")} className={`px-3 py-1.5 rounded text-sm ${filter === "USER" ? "bg-red-600" : "bg-gray-700"}`}>Trabajadores</button>
          <button onClick={() => setFilter("FOREMAN")} className={`px-3 py-1.5 rounded text-sm ${filter === "FOREMAN" ? "bg-red-600" : "bg-gray-700"}`}>Manijeros</button>
          <button onClick={() => setFilter("COMPANY")} className={`px-3 py-1.5 rounded text-sm ${filter === "COMPANY" ? "bg-red-600" : "bg-gray-700"}`}>Empresas</button>
          <button onClick={() => setFilter("banned")} className={`px-3 py-1.5 rounded text-sm ${filter === "banned" ? "bg-red-600" : "bg-gray-700"}`}>Baneados</button>
          <button onClick={() => setFilter("silenced")} className={`px-3 py-1.5 rounded text-sm ${filter === "silenced" ? "bg-red-600" : "bg-gray-700"}`}>Silenciados</button>
        </div>
      </div>

      {/* Buscador */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por email o nombre..."
          className="w-full md:w-64 px-4 py-2 rounded bg-gray-700 text-white placeholder-gray-400 border border-gray-600 focus:border-red-500 focus:outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="text-center py-8">Cargando...</div>
      ) : (
        <>
          <div className="bg-gray-800 rounded-xl overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left">Usuario</th>
                  <th className="px-4 py-3 text-left">Rol</th>
                  <th className="px-4 py-3 text-left">Estado</th>
                  <th className="px-4 py-3 text-left">Sanciones</th>
                  <th className="px-4 py-3 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-gray-700 hover:bg-gray-750">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{getUserName(u)}</p>
                        <p className="text-sm text-gray-400">{u.email}</p>
                        <p className="text-xs text-gray-500">ID: {u.id.substring(0, 8)}...</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className={`px-2 py-1 rounded text-xs ${getRoleBadge(u.role)} text-white border-0 cursor-pointer`}
                      >
                        <option value="USER">Trabajador</option>
                        <option value="FOREMAN">Manijero</option>
                        <option value="COMPANY">Empresa</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      {u.isBanned && <span className="bg-red-600 px-2 py-1 rounded text-xs mr-1">🔒 Baneado</span>}
                      {u.isSilenced && <span className="bg-yellow-600 px-2 py-1 rounded text-xs">🔇 Silenciado</span>}
                      {!u.isBanned && !u.isSilenced && <span className="text-gray-400">Normal</span>}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {u.isBanned && <div className="text-red-400">Razón: {u.banReason || "No especificada"}</div>}
                      {u.isSilenced && u.silencedUntil && (
                        <div className="text-yellow-400">
                          Hasta: {new Date(u.silencedUntil).toLocaleString("es-ES")}
                        </div>
                      )}
                      {u.isBanned && u.bannedUntil && (
                        <div className="text-gray-400">Hasta: {new Date(u.bannedUntil).toLocaleString("es-ES")}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {u.isBanned ? (
                          <button onClick={() => handleBan(u.id, false)} className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm">Desbanear</button>
                        ) : (
                          <button onClick={() => handleBan(u.id, true)} className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm">Banear</button>
                        )}
                        {u.isSilenced ? (
                          <button onClick={() => handleSilence(u.id, false)} className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm">Desilenciar</button>
                        ) : (
                          <button onClick={() => handleSilence(u.id, true)} className="bg-yellow-600 hover:bg-yellow-700 px-3 py-1 rounded text-sm">Silenciar</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                disabled={pagination.page === 1}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 rounded"
              >
                Anterior
              </button>
              <span className="px-4 py-2">
                Página {pagination.page} de {pagination.totalPages}
              </span>
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={pagination.page === pagination.totalPages}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 rounded"
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function AdminCompanies({ onStatsUpdate, adminId }: { onStatsUpdate: () => void; adminId?: string }) {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "verified" | "unverified" | "approved" | "unapproved">("all");

  useEffect(() => {
    loadCompanies();
  }, [filter]);

  const loadCompanies = async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/companies?filter=${filter}`);
    if (res.ok) {
      const data = await res.json();
      setCompanies(data);
    }
    setLoading(false);
  };

  const handleVerify = async (companyId: string, verify: boolean, userId: string) => {
    if (verify) {
      const confirm = window.confirm("¿Verificar esta empresa? Solo verifica empresas que hayas comprobado que son legítimas.");
      if (!confirm) return;
    }

    const res = await fetch("/api/admin/companies/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyId, verify, userId: adminId }),
    });

    if (res.ok) {
      loadCompanies();
      onStatsUpdate();
      alert(verify ? "Empresa verificada" : "Verificación retirada");
    } else {
      alert("Error al realizar la acción");
    }
  };

  const handleApprove = async (companyId: string, approve: boolean, userId: string) => {
    const confirm = window.confirm(approve
      ? "¿Aprobar esta empresa? Podrá publicar ofertas oficiales."
      : "¿Retirar aprobación? La empresa no podrá publicar ofertas oficiales.");
    if (!confirm) return;

    const res = await fetch("/api/admin/companies/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyId, approve, userId: adminId }),
    });

    if (res.ok) {
      loadCompanies();
      onStatsUpdate();
      alert(approve ? "Empresa aprobada" : "Aprobación retirada");
    } else {
      alert("Error al realizar la acción");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Gestión de Empresas</h2>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setFilter("all")} className={`px-4 py-2 rounded ${filter === "all" ? "bg-red-600" : "bg-gray-700"}`}>Todas</button>
          <button onClick={() => setFilter("verified")} className={`px-4 py-2 rounded ${filter === "verified" ? "bg-red-600" : "bg-gray-700"}`}>Verificadas</button>
          <button onClick={() => setFilter("unverified")} className={`px-4 py-2 rounded ${filter === "unverified" ? "bg-red-600" : "bg-gray-700"}`}>Sin Verificar</button>
          <button onClick={() => setFilter("approved")} className={`px-4 py-2 rounded ${filter === "approved" ? "bg-red-600" : "bg-gray-700"}`}>Aprobadas</button>
          <button onClick={() => setFilter("unapproved")} className={`px-4 py-2 rounded ${filter === "unapproved" ? "bg-red-600" : "bg-gray-700"}`}>Sin Aprobar</button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Cargando...</div>
      ) : (
        <div className="bg-gray-800 rounded-xl overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left">Empresa</th>
                <th className="px-4 py-3 text-left">CIF</th>
                <th className="px-4 py-3 text-left">Ubicación</th>
                <th className="px-4 py-3 text-left">Contacto</th>
                <th className="px-4 py-3 text-left">Verificación</th>
                <th className="px-4 py-3 text-left">Aprobación</th>
                <th className="px-4 py-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((c) => (
                <tr key={c.id} className="border-t border-gray-700 hover:bg-gray-750">
                  <td className="px-4 py-3">
                    <p className="font-medium">{c.companyName}</p>
                    <p className="text-sm text-gray-400">{c.user?.email}</p>
                    {c.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{c.description}</p>}
                  </td>
                  <td className="px-4 py-3 font-mono text-sm">{c.cif}</td>
                  <td className="px-4 py-3">{c.city ? `${c.city}, ${c.province}` : c.province || "-"}</td>
                  <td className="px-4 py-3 text-sm">
                    {c.contactPerson && <p>{c.contactPerson}</p>}
                    {c.phone && <p>{c.phone}</p>}
                  </td>
                  <td className="px-4 py-3">
                    {c.isVerified ? (
                      <span className="bg-green-600 px-2 py-1 rounded text-xs flex items-center gap-1">
                        ✅ Verificada
                        {c.verifiedAt && <span className="text-xs opacity-75">({new Date(c.verifiedAt).toLocaleDateString("es-ES")})</span>}
                      </span>
                    ) : (
                      <span className="bg-gray-600 px-2 py-1 rounded text-xs">⏳ Pendiente</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {c.isApproved ? (
                      <span className="bg-blue-600 px-2 py-1 rounded text-xs flex items-center gap-1">
                        ✅ Aprobada
                        {c.approvedAt && <span className="text-xs opacity-75">({new Date(c.approvedAt).toLocaleDateString("es-ES")})</span>}
                      </span>
                    ) : (
                      <span className="bg-orange-600 px-2 py-1 rounded text-xs">⏳ Sin Aprobar</span>
                    )}
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    {c.isVerified ? (
                      <button onClick={() => handleVerify(c.id, false, c.userId)} className="bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-sm">Retirar</button>
                    ) : (
                      <button onClick={() => handleVerify(c.id, true, c.userId)} className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm">Verificar</button>
                    )}
                    {c.isVerified && !c.isApproved && (
                      <button onClick={() => handleApprove(c.id, true, c.userId)} className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm">Aprobar</button>
                    )}
                    {c.isApproved && (
                      <button onClick={() => handleApprove(c.id, false, c.userId)} className="bg-orange-600 hover:bg-orange-700 px-3 py-1 rounded text-sm">Retirar</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AdminPosts({ adminId, onStatsUpdate }: { adminId?: string; onStatsUpdate: () => void }) {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "ACTIVE" | "HIDDEN" | "REMOVED">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "OFFICIAL" | "SHARED" | "DEMAND">("all");

  useEffect(() => {
    loadPosts();
  }, [filter, typeFilter]);

  const loadPosts = async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/posts?filter=${filter}&type=${typeFilter}`);
    if (res.ok) {
      const data = await res.json();
      setPosts(data);
    }
    setLoading(false);
  };

  const handleModerate = async (postId: string, status: "ACTIVE" | "HIDDEN" | "REMOVED") => {
    let reason: string | null | undefined = undefined;
    if (status === "REMOVED") {
      reason = prompt("Razón de la eliminación:");
      if (reason === null) return;
    } else if (status === "HIDDEN") {
      reason = prompt("Razón para ocultar (opcional):") || undefined;
      if (reason === "") reason = undefined;
    }

    const res = await fetch("/api/admin/posts/moderate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, status, reason, adminId }),
    });

    if (res.ok) {
      loadPosts();
      onStatsUpdate();
      alert("Publicación actualizada");
    } else {
      alert("Error al realizar la acción");
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold">Gestión de Publicaciones</h2>

        <div className="flex flex-wrap gap-2">
          {/* Filtro por estado */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-4 py-2 rounded bg-gray-700 text-white"
          >
            <option value="all">Todos los estados</option>
            <option value="ACTIVE">Activas</option>
            <option value="HIDDEN">Ocultas</option>
            <option value="REMOVED">Eliminadas</option>
          </select>

          {/* Filtro por tipo */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-4 py-2 rounded bg-gray-700 text-white"
          >
            <option value="all">Todos los tipos</option>
            <option value="OFFICIAL">Oficiales</option>
            <option value="SHARED">Compartidas</option>
            <option value="DEMAND">Demandas</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Cargando...</div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className={`bg-gray-800 rounded-xl p-4 border-l-4 ${
              post.status === "REMOVED" ? "border-red-600" :
              post.status === "HIDDEN" ? "border-yellow-600" :
              "border-green-600"
            }`}>
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`px-2 py-1 rounded text-xs ${
                      post.type === "OFFICIAL" ? "bg-green-600" :
                      post.type === "DEMAND" ? "bg-orange-600" :
                      "bg-blue-600"
                    }`}>{post.type === "OFFICIAL" ? "Oficial" : post.type === "DEMAND" ? "Demanda" : "Compartida"}</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      post.status === "ACTIVE" ? "bg-green-600" :
                      post.status === "HIDDEN" ? "bg-yellow-600" :
                      "bg-red-600"
                    }`}>{post.status === "ACTIVE" ? "Activa" : post.status === "HIDDEN" ? "Oculta" : "Eliminada"}</span>
                    {post.company?.isVerified && <span className="bg-purple-600 px-2 py-1 rounded text-xs">✅ Empresa verificada</span>}
                  </div>
                  <h3 className="font-bold text-lg">{post.title}</h3>
                  <p className="text-gray-400 text-sm mt-1">📍 {post.location} ({post.province || "N/A"})</p>
                  <p className="text-gray-300 mt-2 line-clamp-2">"{post.description}"</p>
                  <p className="text-gray-500 text-xs mt-2">
                    Por: {post.company?.companyName || post.publisher?.workerProfile?.fullName || post.publisher?.foremanProfile?.fullName || "Usuario"}
                  </p>
                  <p className="text-gray-600 text-xs mt-1">Publicado: {new Date(post.createdAt).toLocaleString("es-ES")}</p>
                  {post.moderationReason && (
                    <p className="text-red-400 text-sm mt-2">⚠️ {post.moderationReason}</p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  {post.status !== "ACTIVE" && (
                    <button onClick={() => handleModerate(post.id, "ACTIVE")} className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm">Activar</button>
                  )}
                  {post.status !== "HIDDEN" && (
                    <button onClick={() => handleModerate(post.id, "HIDDEN")} className="bg-yellow-600 hover:bg-yellow-700 px-3 py-1 rounded text-sm">Ocultar</button>
                  )}
                  {post.status !== "REMOVED" && (
                    <button onClick={() => handleModerate(post.id, "REMOVED")} className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm">Eliminar</button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {posts.length === 0 && (
            <div className="text-center py-12 bg-gray-800 rounded-xl border border-gray-700 border-dashed">
              <p className="text-gray-400">No hay publicaciones con estos filtros</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AdminReports({ onStatsUpdate, adminId }: { onStatsUpdate: () => void; adminId?: string }) {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "PENDING" | "RESOLVED" | "DISMISSED">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "USER" | "POST">("all");

  useEffect(() => {
    loadReports();
  }, [filter, typeFilter]);

  const loadReports = async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/reports?filter=${filter}&type=${typeFilter}`);
    if (res.ok) {
      const data = await res.json();
      setReports(data);
    }
    setLoading(false);
  };

  const handleResolve = async (reportId: string, status: "RESOLVED" | "DISMISSED") => {
    const resolution = prompt(status === "RESOLVED" ? "Describe la resolución tomada:" : "Razón para desestimar:");
    if (resolution === null) return;

    const res = await fetch("/api/admin/reports/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportId, status, resolution, adminId }),
    });

    if (res.ok) {
      loadReports();
      onStatsUpdate();
      alert("Denuncia resuelta");
    } else {
      alert("Error al realizar la acción");
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: "bg-yellow-600",
      REVIEWED: "bg-blue-600",
      RESOLVED: "bg-green-600",
      DISMISSED: "bg-gray-600",
    };
    return colors[status] || "bg-gray-600";
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold">Gestión de Denuncias</h2>
        <div className="flex flex-wrap gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-4 py-2 rounded bg-gray-700 text-white"
          >
            <option value="all">Todos los estados</option>
            <option value="PENDING">Pendientes</option>
            <option value="RESOLVED">Resueltas</option>
            <option value="DISMISSED">Desestimadas</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-4 py-2 rounded bg-gray-700 text-white"
          >
            <option value="all">Todos los tipos</option>
            <option value="USER">Usuarios</option>
            <option value="POST">Publicaciones</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Cargando...</div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div key={report.id} className="bg-gray-800 rounded-xl p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`px-2 py-1 rounded text-xs ${
                      report.type === "USER" ? "bg-purple-600" : "bg-blue-600"
                    }`}>{report.type === "USER" ? "Usuario" : "Publicación"}</span>
                    <span className={`px-2 py-1 rounded text-xs ${getStatusBadge(report.status)}`}>
                      {report.status === "PENDING" ? "Pendiente" :
                       report.status === "RESOLVED" ? "Resuelta" :
                       report.status === "DISMISSED" ? "Desestimada" : report.status}
                    </span>
                  </div>
                  <p className="font-bold text-lg">{report.reason}</p>
                  {report.description && <p className="text-gray-400 text-sm mt-1">{report.description}</p>}
                  <div className="mt-2 text-sm text-gray-500">
                    <p>Denunciado por: <span className="text-gray-300">{report.reporter?.email}</span></p>
                    <p>Fecha: {new Date(report.createdAt).toLocaleString("es-ES")}</p>
                  </div>
                  {report.resolution && (
                    <div className="mt-3 p-2 bg-green-900 rounded text-green-300 text-sm">
                      <strong>Resolución:</strong> {report.resolution}
                      {report.resolvedAt && <span className="ml-2 text-xs opacity-75">({new Date(report.resolvedAt).toLocaleDateString("es-ES")})</span>}
                    </div>
                  )}
                </div>
                {report.status === "PENDING" && (
                  <div className="flex gap-2 ml-4">
                    <button onClick={() => handleResolve(report.id, "RESOLVED")} className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm">Resolver</button>
                    <button onClick={() => handleResolve(report.id, "DISMISSED")} className="bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-sm">Desestimar</button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {reports.length === 0 && (
            <div className="text-center py-12 bg-gray-800 rounded-xl border border-gray-700 border-dashed">
              <p className="text-gray-400">No hay denuncias con estos filtros</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AdminLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState<string>("all");

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/logs?action=${actionFilter}`);
    if (res.ok) {
      const data = await res.json();
      setLogs(data);
    }
    setLoading(false);
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, { label: string; icon: string; color: string }> = {
      BAN_USER: { label: "Baneó usuario", icon: "🔒", color: "text-red-400" },
      UNBAN_USER: { label: "Desbaneó usuario", icon: "🔓", color: "text-green-400" },
      SILENCE_USER: { label: "Silenció usuario", icon: "🔇", color: "text-yellow-400" },
      UNSILENCE_USER: { label: "Desilenció usuario", icon: "🔊", color: "text-green-400" },
      VERIFY_COMPANY: { label: "Verificó empresa", icon: "✅", color: "text-green-400" },
      UNVERIFY_COMPANY: { label: "Retiró verificación", icon: "❌", color: "text-red-400" },
      HIDE_POST: { label: "Ocultó publicación", icon: "👁️", color: "text-yellow-400" },
      SHOW_POST: { label: "Mostró publicación", icon: "👁️", color: "text-green-400" },
      REMOVE_POST: { label: "Eliminó publicación", icon: "🗑️", color: "text-red-400" },
      RESOLVE_REPORT: { label: "Resolvió denuncia", icon: "⚖️", color: "text-blue-400" },
      DELETE_USER: { label: "Eliminó usuario", icon: "🗑️", color: "text-red-400" },
    };
    return labels[action] || { label: action, icon: "•", color: "text-gray-400" };
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Historial de Acciones</h2>
        <div className="flex gap-2">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-4 py-2 rounded bg-gray-700 text-white"
          >
            <option value="all">Todas las acciones</option>
            <option value="BAN_USER">Baneos</option>
            <option value="SILENCE_USER">Silencios</option>
            <option value="VERIFY_COMPANY">Verificaciones</option>
            <option value="REMOVE_POST">Eliminaciones</option>
            <option value="RESOLVE_REPORT">Denuncias</option>
          </select>
          <button onClick={loadLogs} className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded">Actualizar</button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Cargando...</div>
      ) : (
        <div className="bg-gray-800 rounded-xl overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left">Fecha</th>
                <th className="px-4 py-3 text-left">Admin</th>
                <th className="px-4 py-3 text-left">Acción</th>
                <th className="px-4 py-3 text-left">Objetivo</th>
                <th className="px-4 py-3 text-left">Detalles</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const actionInfo = getActionLabel(log.action);
                return (
                  <tr key={log.id} className="border-t border-gray-700 hover:bg-gray-750">
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {new Date(log.createdAt).toLocaleString("es-ES")}
                    </td>
                    <td className="px-4 py-3 font-mono text-sm">{log.adminId.substring(0, 8)}...</td>
                    <td className="px-4 py-3">
                      <span className={actionInfo.color}>
                        {actionInfo.icon} {actionInfo.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="text-gray-400">{log.targetType}:</span>
                      <span className="ml-1 font-mono">{log.targetId.substring(0, 8)}...</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">{log.details || "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
