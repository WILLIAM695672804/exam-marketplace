"use client";

import { useState } from "react";

interface User {
  id: string; firstName: string; lastName: string; email: string;
  isActive: boolean; phone: string | null; createdAt: string;
  userRoles: { role: { name: string } }[];
}

interface Role { id: string; name: string; }

export function UsersManager(props: {
  initialUsers: User[]; allRoles: Role[];
  total: number; buyerCount: number; teacherCount: number; adminCount: number;
}) {
  const [users, setUsers] = useState<User[]>(props.initialUsers);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function toggleActive(user: User) {
    const res = await fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !user.isActive }),
    });
    if (res.ok) {
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, isActive: !user.isActive } : u)));
    }
  }

  async function handleRoleChange(userId: string, roleId: string, action: "add" | "remove") {
    const res = await fetch(`/api/users/${userId}/roles`, {
      method: action === "add" ? "POST" : "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roleId }),
    });
    if (res.ok) {
      setUsers((prev) => prev.map((u) => {
        if (u.id !== userId) return u;
        if (action === "add") {
          const role = props.allRoles.find((r) => r.id === roleId);
          return role ? { ...u, userRoles: [...u.userRoles, { role: { name: role.name } }] } : u;
        }
        return { ...u, userRoles: u.userRoles.filter((ur) => props.allRoles.find((r) => r.id === roleId)?.name !== ur.role.name) };
      }));
    }
  }

  async function handleSaveEdit(e: React.FormEvent<HTMLFormElement>, user: User) {
    e.preventDefault();
    setPending(true);
    const form = new FormData(e.currentTarget);
    const res = await fetch(`/api/users/${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: form.get("firstName"),
        lastName: form.get("lastName"),
        email: form.get("email"),
        phone: form.get("phone"),
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, ...data } : u)));
      setEditingId(null);
    }
    setPending(false);
  }

  const stats = [
    { label: "Total", value: props.total },
    { label: "Acheteurs", value: props.buyerCount },
    { label: "Enseignants", value: props.teacherCount },
    { label: "Admins", value: props.adminCount },
  ];

  return (
    <div className="max-w-container-max mx-auto w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
        <div>
          <h2 className="font-headline-md text-primary mb-2">Gestion des utilisateurs</h2>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">Gerer les participants, assigner les roles et surveiller les comptes.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter mb-12">
        {stats.map((stat) => (
          <div key={stat.label} className="border border-outline-variant bg-surface p-6 flex flex-col gap-4">
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">{stat.label}</span>
            <div className="font-headline-lg font-headline-lg">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="border border-outline-variant bg-surface-container-lowest overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-outline-variant">
              {["Utilisateur", "Email", "Roles", "Statut", "Actions"].map((h) => (
                <th key={h} className="text-left font-label-caps text-label-caps text-on-surface-variant uppercase px-6 py-4">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              editingId === user.id ? (
                <tr key={user.id} className="border-b border-outline-variant/50 bg-surface-container-low">
                  <td colSpan={5} className="px-6 py-4">
                    <form onSubmit={(e) => handleSaveEdit(e, user)} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <input name="firstName" defaultValue={user.firstName} className="bg-transparent border-b border-outline-variant py-2 px-0 text-body-md text-primary outline-none focus:border-primary" placeholder="Prenom" />
                      <input name="lastName" defaultValue={user.lastName} className="bg-transparent border-b border-outline-variant py-2 px-0 text-body-md text-primary outline-none focus:border-primary" placeholder="Nom" />
                      <input name="email" defaultValue={user.email} className="bg-transparent border-b border-outline-variant py-2 px-0 text-body-md text-primary outline-none focus:border-primary" placeholder="Email" />
                      <input name="phone" defaultValue={user.phone || ""} className="bg-transparent border-b border-outline-variant py-2 px-0 text-body-md text-primary outline-none focus:border-primary" placeholder="Telephone" />
                      <div className="md:col-span-4 flex gap-3 justify-end mt-2">
                        <button type="submit" disabled={pending} className="bg-primary text-on-primary font-label-caps text-label-caps uppercase py-2 px-4 hover:bg-inverse-surface transition-colors disabled:opacity-70">{pending ? "..." : "Enregistrer"}</button>
                        <button type="button" onClick={() => setEditingId(null)} className="border border-primary text-primary font-label-caps text-label-caps uppercase py-2 px-4 hover:bg-surface-container transition-colors">Annuler</button>
                      </div>
                    </form>
                  </td>
                </tr>
              ) : (
                <tr key={user.id} className="border-b border-outline-variant/50 hover:bg-surface-container-low transition-colors">
                  <td className="px-6 py-4 font-body-md text-primary">{user.firstName} {user.lastName}</td>
                  <td className="px-6 py-4 font-body-sm text-on-surface-variant">{user.email}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {user.userRoles.map((ur) => (
                        <span key={ur.role.name} className="px-2 py-1 bg-surface-container text-on-surface-variant font-label-caps text-[10px] uppercase border border-outline-variant inline-flex items-center gap-1">
                          {ur.role.name}
                          <button onClick={() => handleRoleChange(user.id, props.allRoles.find((r) => r.name === ur.role.name)?.id || "", "remove")} className="hover:text-error ml-1">&times;</button>
                        </span>
                      ))}
                      <select
                        className="bg-transparent border-0 border-b border-outline-variant text-[10px] uppercase font-label-caps outline-none"
                        value=""
                        onChange={(e) => { if (e.target.value) handleRoleChange(user.id, e.target.value, "add"); e.target.value = ""; }}
                      >
                        <option value="">+ Role</option>
                        {props.allRoles.filter((r) => !user.userRoles.some((ur) => ur.role.name === r.name)).map((r) => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => toggleActive(user)} className={`px-2 py-1 font-label-caps text-[10px] uppercase hover:opacity-80 transition-opacity ${user.isActive ? "bg-secondary-container text-on-secondary-container" : "bg-error-container text-on-error-container"}`}>
                      {user.isActive ? "Actif" : "Inactif"}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => setEditingId(user.id)} className="p-2 hover:bg-surface-container transition-colors">
                      <span className="material-symbols-outlined text-[18px] text-on-surface-variant">edit</span>
                    </button>
                  </td>
                </tr>
              )
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
