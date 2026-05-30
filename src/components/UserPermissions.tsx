import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ShieldAlert } from "lucide-react";

type Role = "admin" | "manager" | "viewer";
const ROLES: Role[] = ["admin", "manager", "viewer"];

interface UserRow {
  user_id: string;
  email: string | null;
  display_name: string | null;
  roles: Role[];
}

export function UserPermissions() {
  const { isAdmin, user, refreshRoles } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [{ data: profiles }, { data: roleRows }] = await Promise.all([
      supabase.from("profiles").select("user_id, email, display_name"),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    const byUser = new Map<string, Role[]>();
    (roleRows ?? []).forEach((r: any) => {
      const arr = byUser.get(r.user_id) ?? [];
      arr.push(r.role);
      byUser.set(r.user_id, arr);
    });
    setUsers(
      (profiles ?? []).map((p: any) => ({
        user_id: p.user_id,
        email: p.email,
        display_name: p.display_name,
        roles: byUser.get(p.user_id) ?? [],
      }))
    );
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) load();
    else setLoading(false);
  }, [isAdmin]);

  const toggle = async (userId: string, role: Role, has: boolean) => {
    if (has) {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
      if (error) return toast.error(error.message);
    }
    toast.success("Role updated");
    await load();
    if (userId === user?.id) await refreshRoles();
  };

  if (!isAdmin) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6 flex items-center gap-3 text-muted-foreground">
            <ShieldAlert className="w-5 h-5" />
            You need admin access to manage user permissions.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>User Permissions</CardTitle>
          <CardDescription>Assign roles to control what each user can do.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-muted-foreground">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  {ROLES.map((r) => (
                    <TableHead key={r} className="text-center capitalize">{r}</TableHead>
                  ))}
                  <TableHead>Current</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.user_id}>
                    <TableCell className="font-medium">{u.display_name ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    {ROLES.map((r) => {
                      const has = u.roles.includes(r);
                      const isSelf = u.user_id === user?.id && r === "admin";
                      return (
                        <TableCell key={r} className="text-center">
                          <Checkbox
                            checked={has}
                            disabled={isSelf && has}
                            onCheckedChange={() => toggle(u.user_id, r, has)}
                          />
                        </TableCell>
                      );
                    })}
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {u.roles.length === 0 && <Badge variant="outline">none</Badge>}
                        {u.roles.map((r) => (
                          <Badge key={r} variant={r === "admin" ? "default" : "secondary"}>{r}</Badge>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <p className="text-xs text-muted-foreground mt-4">
            Admins manage users and roles. Managers can edit data. Viewers have read-only access. You cannot remove your own admin role.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}