import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, ShieldCheck, Smartphone, Key, CheckCircle2, XCircle, AlertTriangle, Copy, RefreshCw, Download } from "lucide-react";
import { toast } from "sonner";

const BACKUP_CODES = ["7X2K-9M4P","3N8Q-5T1R","6W4J-2L7S","9E3B-8H6U","4P1F-7K5V","2A9C-6N3Y","8M7D-1Q4Z","5R2X-3G8W"];

const USERS_2FA = [
  { user:"Sarah Chen",  avatar:"SC", role:"Admin",   status:true,  method:"Authenticator App", lastUsed:"2026-05-30 09:14" },
  { user:"James Dowell",avatar:"JD", role:"Manager", status:true,  method:"SMS",               lastUsed:"2026-05-29 16:42" },
  { user:"Maria Reyes", avatar:"MR", role:"Staff",   status:false, method:"Not Configured",    lastUsed:"Never" },
  { user:"Tom Keller",  avatar:"TK", role:"Staff",   status:false, method:"Not Configured",    lastUsed:"Never" },
  { user:"Amy Lin",     avatar:"AL", role:"Viewer",  status:true,  method:"Authenticator App", lastUsed:"2026-05-28 14:20" },
  { user:"Nate Ford",   avatar:"NF", role:"Staff",   status:false, method:"Not Configured",    lastUsed:"Never" },
];

export function TwoFactorAuth() {
  const [globalEnabled, setGlobalEnabled] = useState(true);
  const [adminRequired, setAdminRequired] = useState(true);
  const [allRequired, setAllRequired]     = useState(false);
  const [setupStep, setSetupStep]         = useState<null|"qr"|"verify"|"backup">(null);
  const [verifyCode, setVerifyCode]       = useState("");
  const [codesRevealed, setCodesRevealed] = useState(false);

  const enabled2FA = USERS_2FA.filter(u => u.status).length;
  const notSetup   = USERS_2FA.filter(u => !u.status).length;

  const startSetup = () => { setSetupStep("qr"); setVerifyCode(""); };
  const verifySetup = () => {
    if (verifyCode.length !== 6) { toast.error("Enter 6-digit code"); return; }
    setSetupStep("backup"); toast.success("2FA verified successfully!");
  };
  const finishSetup = () => { setSetupStep(null); setCodesRevealed(false); toast.success("2FA is now active for your account"); };

  const copyCode = (code: string) => { navigator.clipboard.writeText(code); toast.success("Code copied"); };
  const downloadCodes = () => toast.success("Backup codes downloaded");

  return (
    <div className="flex-1 overflow-auto p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Shield className="w-6 h-6"/>Two-Factor Authentication</h1>
          <p className="text-sm text-muted-foreground">Manage 2FA settings and security policies for all users</p>
        </div>
        <Button size="sm" onClick={startSetup}><ShieldCheck className="w-4 h-4 mr-1"/>Setup My 2FA</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label:"2FA Enabled",    value:enabled2FA, color:"text-green-600" },
          { label:"Not Configured", value:notSetup,   color:"text-red-600" },
          { label:"Total Users",    value:USERS_2FA.length, color:"text-blue-600" },
          { label:"Security Score", value:"72%",      color:"text-orange-600" },
        ].map(s => (
          <Card key={s.label} className="p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </Card>
        ))}
      </div>

      {notSetup > 0 && (
        <Card className="p-4 border-yellow-300 bg-yellow-50">
          <div className="flex items-center gap-2 text-yellow-700">
            <AlertTriangle className="w-5 h-5"/>
            <span className="font-semibold">{notSetup} users haven't set up 2FA — your account security is at risk</span>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Policy Settings */}
        <Card className="p-5 space-y-4">
          <h3 className="font-semibold flex items-center gap-2"><Key className="w-4 h-4"/>Security Policy</h3>
          <Separator/>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Enable 2FA System-Wide</p>
                <p className="text-xs text-muted-foreground">Allow users to use 2FA</p>
              </div>
              <Switch checked={globalEnabled} onCheckedChange={v=>{setGlobalEnabled(v);toast.success(v?"2FA enabled globally":"2FA disabled globally");}}/>
            </div>
            <Separator/>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Require for Admins</p>
                <p className="text-xs text-muted-foreground">All admin accounts must use 2FA</p>
              </div>
              <Switch checked={adminRequired} onCheckedChange={v=>{setAdminRequired(v);toast.success(v?"Required for admins":"Admin requirement removed");}}/>
            </div>
            <Separator/>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Require for All Users</p>
                <p className="text-xs text-muted-foreground">All accounts must use 2FA</p>
              </div>
              <Switch checked={allRequired} onCheckedChange={v=>{setAllRequired(v);toast.success(v?"Required for all users":"Removed for all users");}}/>
            </div>
          </div>
          <Separator/>
          <div className="space-y-2 text-sm">
            <p className="font-medium text-muted-foreground">Supported Methods</p>
            <div className="flex items-center gap-2"><Smartphone className="w-4 h-4 text-green-600"/><span>Authenticator App (TOTP)</span><CheckCircle2 className="w-3.5 h-3.5 text-green-500 ml-auto"/></div>
            <div className="flex items-center gap-2"><span className="text-base">📱</span><span>SMS One-Time Code</span><CheckCircle2 className="w-3.5 h-3.5 text-green-500 ml-auto"/></div>
            <div className="flex items-center gap-2"><Key className="w-4 h-4 text-muted-foreground"/><span>Backup Codes</span><CheckCircle2 className="w-3.5 h-3.5 text-green-500 ml-auto"/></div>
          </div>
        </Card>

        {/* User 2FA Status */}
        <Card className="col-span-2">
          <div className="p-4 border-b"><h3 className="font-semibold">User 2FA Status</h3></div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>2FA Status</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Last Used</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {USERS_2FA.map(u => (
                <TableRow key={u.user}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{u.avatar}</div>
                      <span className="text-sm font-medium">{u.user}</span>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{u.role}</Badge></TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${u.status?"bg-green-100 text-green-700":"bg-red-100 text-red-700"}`}>
                      {u.status?<CheckCircle2 className="w-3 h-3"/>:<XCircle className="w-3 h-3"/>}
                      {u.status?"Enabled":"Not Setup"}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{u.method}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{u.lastUsed}</TableCell>
                  <TableCell>
                    {!u.status && (
                      <Button size="sm" variant="outline" className="text-xs h-7"
                        onClick={() => toast.success(`Setup reminder sent to ${u.user}`)}>
                        Send Reminder
                      </Button>
                    )}
                    {u.status && (
                      <Button size="sm" variant="ghost" className="text-xs h-7 text-red-600"
                        onClick={() => toast.success(`2FA reset for ${u.user}`)}>
                        Reset
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Setup Modal */}
      {setupStep && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6 space-y-5">
            {setupStep === "qr" && (
              <>
                <h2 className="text-lg font-bold flex items-center gap-2"><Smartphone className="w-5 h-5"/>Set Up Authenticator App</h2>
                <p className="text-sm text-muted-foreground">1. Download Google Authenticator or Authy</p>
                <p className="text-sm text-muted-foreground">2. Scan this QR code with your app</p>
                <div className="h-48 bg-muted rounded-xl flex items-center justify-center border-2 border-dashed border-border">
                  <div className="text-center">
                    <div className="text-4xl mb-2">📷</div>
                    <p className="text-sm text-muted-foreground">QR Code renders here</p>
                    <p className="text-xs text-muted-foreground mt-1">JBSWY3DPEHPK3PXP (manual key)</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Input placeholder="Enter 6-digit code to verify" value={verifyCode} onChange={e=>setVerifyCode(e.target.value.slice(0,6))} maxLength={6} className="font-mono text-lg tracking-widest text-center"/>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setSetupStep(null)}>Cancel</Button>
                  <Button className="flex-1" onClick={verifySetup}>Verify & Enable</Button>
                </div>
              </>
            )}
            {setupStep === "backup" && (
              <>
                <h2 className="text-lg font-bold flex items-center gap-2"><Key className="w-5 h-5"/>Save Backup Codes</h2>
                <p className="text-sm text-muted-foreground">Save these codes in a safe place. Each can only be used once.</p>
                <div className="grid grid-cols-2 gap-2">
                  {BACKUP_CODES.map(code => (
                    <div key={code} className="flex items-center justify-between bg-muted rounded px-3 py-2">
                      <span className="font-mono text-sm">{codesRevealed ? code : "••••-••••"}</span>
                      {codesRevealed && <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => copyCode(code)}><Copy className="w-3 h-3"/></Button>}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={() => setCodesRevealed(v=>!v)}>
                    {codesRevealed ? "Hide Codes" : "Reveal Codes"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={downloadCodes}><Download className="w-4 h-4 mr-1"/>Download</Button>
                </div>
                <Button className="w-full" onClick={finishSetup}>I've Saved My Codes — Finish Setup</Button>
              </>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
