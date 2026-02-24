"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { adminApi } from "@/lib/api";
import { useRole } from "@/hooks/use-role";
import { useAuth } from "@/hooks/use-auth";
import { UserRole } from "@/types";
import { UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AdminUser {
  id: string;
  email: string;
  name: string;
  avatar: string;
  provider: string;
  role: UserRole;
  createdAt: string;
}

export default function AdminUsersPage() {
  const t = useTranslations();
  const router = useRouter();
  const { loading, user: currentUser } = useAuth();
  const { isAdmin } = useRole();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [fetching, setFetching] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.replace("/");
    }
  }, [loading, isAdmin, router]);

  useEffect(() => {
    if (!isAdmin) return;
    adminApi
      .getUsers()
      .then(setUsers)
      .catch(() => {
        toast.error(t("common.error"));
      })
      .finally(() => setFetching(false));
  }, [isAdmin]);

  async function handleRoleChange(userId: string, role: UserRole) {
    setUpdating(userId);
    try {
      const updated = await adminApi.updateUserRole(userId, role);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: updated.role } : u)),
      );
      toast.success(t("admin.roleUpdated"));
    } catch {
      toast.error(t("common.error"));
    } finally {
      setUpdating(null);
    }
  }

  if (loading || fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <UserCog className="h-6 w-6 text-purple-500" />
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {t("admin.usersTitle")}
        </h1>
        <span className="rounded-full bg-purple-100 dark:bg-purple-500/10 px-2.5 py-0.5 text-sm font-medium text-purple-700 dark:text-purple-400">
          {users.length}
        </span>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800/50 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/50">
              <th className="text-left px-4 py-3 font-medium text-slate-500 dark:text-slate-400">
                {t("admin.user")}
              </th>
              <th className="text-left px-4 py-3 font-medium text-slate-500 dark:text-slate-400">
                {t("admin.provider")}
              </th>
              <th className="text-left px-4 py-3 font-medium text-slate-500 dark:text-slate-400">
                {t("admin.joined")}
              </th>
              <th className="text-left px-4 py-3 font-medium text-slate-500 dark:text-slate-400">
                {t("admin.role")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {users.map((u) => (
              <tr
                key={u.id}
                className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {u.avatar ? (
                      <img
                        src={u.avatar}
                        alt={u.name}
                        className="h-8 w-8 rounded-full"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-500">
                        {u.name?.[0]?.toUpperCase() ?? "?"}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {u.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {u.email}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400 capitalize">
                  {u.provider}
                </td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <Select
                    value={u.role}
                    onValueChange={(val) =>
                      handleRoleChange(u.id, val as UserRole)
                    }
                    disabled={updating === u.id || u.id === currentUser?.id}
                  >
                    <SelectTrigger className="w-36 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={UserRole.USER}>
                        {t("roles.user")}
                      </SelectItem>
                      <SelectItem value={UserRole.MODERATOR}>
                        {t("roles.moderator")}
                      </SelectItem>
                      <SelectItem value={UserRole.ADMIN}>
                        {t("roles.admin")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
