"use client";

import { useEffect, useState } from "react";

type Shift = { id: number; name: string; gender_scope: string };
type ExistingUser = { id: number; name: string; role: string; username: string | null };

export default function DevelopmentHub() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [users, setUsers] = useState<ExistingUser[]>([]);
  const [newManager, setNewManager] = useState({ shiftId: "", fullName: "", username: "", phone: "", password: "" });
  const [existing, setExisting] = useState({ shiftId: "", userId: "" });
  const [message, setMessage] = useState("");

  const load = () => {
    fetch("/api/shifts").then(r => r.json()).then(d => setShifts(d.shifts || []));
    fetch("/api/auth/admin").then(r => r.json()).then(d => setUsers(d.users || []));
  };
  useEffect(load, []);

  const assignExisting = async (event: React.FormEvent) => {
    event.preventDefault(); setMessage("");
    const user = users.find(item => item.id === Number(existing.userId));
    if (!user) return;
    const roleResponse = await fetch("/api/auth/admin", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: user.id, role: "ADMIN" }) });
    const roleData = await roleResponse.json();
    if (!roleResponse.ok) { setMessage(roleData.error); return; }
    const linkResponse = await fetch("/api/shifts", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "admin", userId: user.id, shiftId: existing.shiftId }) });
    const linkData = await linkResponse.json();
    setMessage(linkResponse.ok ? `تم تحويل ${user.name} إلى مدير فترة وربطه بنجاح` : linkData.error);
    if (linkResponse.ok) { setExisting({ shiftId: "", userId: "" }); load(); }
  };

  const create = async (event: React.FormEvent) => {
    event.preventDefault(); setMessage("");
    const response = await fetch("/api/auth/admin", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...newManager, role: "ADMIN" }) });
    const data = await response.json();
    if (!response.ok) { setMessage(data.error); return; }
    const link = await fetch("/api/shifts", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "admin", userId: data.id, shiftId: newManager.shiftId }) });
    const linkData = await link.json();
    setMessage(link.ok ? "تم إنشاء مدير الفترة وربطه بنجاح" : linkData.error);
    if (link.ok) { setNewManager({ shiftId: "", fullName: "", username: "", phone: "", password: "" }); load(); }
  };
  const enterShift = async (shiftId:number) => {const response=await fetch("/api/session/shifts",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({shiftId})});if(response.ok)location.href="/dashboard";else setMessage("تعذر فتح الفترة")};
  const disableManager = async (user: ExistingUser) => {
    if (!confirm(`إلغاء حساب المدير ${user.name}؟ لن يستطيع الدخول بعد ذلك.`)) return;
    setMessage("");
    const response = await fetch("/api/auth/admin", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: user.id }) });
    const data = await response.json();
    setMessage(response.ok ? data.message : data.error);
    if (response.ok) load();
  };
  const managers = users.filter(user => user.role === "ADMIN" || user.role === "SUPER_ADMIN");

  return <main className="development-hub" dir="rtl">
    <header><span>دائرة التطوير</span><h1>إدارة الفترات ومديري المدارس</h1><p>هذه اللوحة خاصة بمشرف النظام الكامل فقط.</p></header>
    <section className="development-shifts">{shifts.map(shift => <article key={shift.id} className={shift.gender_scope === "FEMALE" ? "evening" : "morning"}><h2>{shift.name}</h2><p>{shift.gender_scope === "FEMALE" ? "مدرسة البنات — الفترة المسائية" : "مدرسة البنين — الفترة الصباحية"}</p><button className="primary" onClick={()=>enterShift(shift.id)}>دخول لوحة هذه الفترة</button></article>)}</section>
    {message && <p className="form-error">{message}</p>}
    <section className="development-forms">
      <form onSubmit={assignExisting} className="development-form"><h2>تعيين حساب موجود مديرًا</h2><p>استخدمه للحسابات الموجودة مثل صالح ثابت صالح، ولا تنشئ حسابًا مكررًا.</p><select required value={existing.userId} onChange={e => setExisting({ ...existing, userId: e.target.value })}><option value="">اختر الحساب</option>{users.map(user => <option key={user.id} value={user.id}>{user.name}{user.username ? ` — ${user.username}` : ""}</option>)}</select><select required value={existing.shiftId} onChange={e => setExisting({ ...existing, shiftId: e.target.value })}><option value="">اختر الفترة</option>{shifts.map(shift => <option key={shift.id} value={shift.id}>{shift.name}</option>)}</select><button className="primary">تحويله إلى مدير وربطه</button></form>
      <form onSubmit={create} className="development-form"><h2>إنشاء مدير فترة جديد</h2><select required value={newManager.shiftId} onChange={e => setNewManager({ ...newManager, shiftId: e.target.value })}><option value="">اختر الفترة</option>{shifts.map(shift => <option key={shift.id} value={shift.id}>{shift.name}</option>)}</select><input required placeholder="الاسم الثلاثي" value={newManager.fullName} onChange={e => setNewManager({ ...newManager, fullName: e.target.value })}/><input required placeholder="اسم المستخدم" value={newManager.username} onChange={e => setNewManager({ ...newManager, username: e.target.value })}/><input placeholder="رقم الجوال" value={newManager.phone} onChange={e => setNewManager({ ...newManager, phone: e.target.value })}/><input required type="password" minLength={8} placeholder="كلمة المرور المؤقتة" value={newManager.password} onChange={e => setNewManager({ ...newManager, password: e.target.value })}/><button className="primary">إنشاء مدير وربطه بالفترة</button></form>
    </section>
    <section className="development-form"><h2>الحسابات الإدارية الحالية</h2><p>هذه قائمة الحسابات التي تظهر في دائرة التطوير. يمكنك إلغاء المدير المكرر أو غير المطلوب؛ أما مشرف النظام فهو محمي.</p>{managers.map(user => <div key={user.id} className="settings-actions"><span>{user.name}{user.username ? ` — ${user.username}` : ""} ({user.role === "SUPER_ADMIN" ? "مشرف النظام" : "مدير فترة"})</span>{user.role === "ADMIN" ? <button type="button" className="danger" onClick={() => disableManager(user)}>إلغاء الحساب</button> : <span className="permission-chip">حساب محمي</span>}</div>)}</section>
  </main>;
}
