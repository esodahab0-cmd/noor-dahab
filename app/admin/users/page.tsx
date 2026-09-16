"use client";

import { useState, useEffect } from "react";
import { Users, UserPlus, ShieldX, CheckCircle, Phone, User } from "lucide-react";
import { collection, getDocs, doc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

interface UserDoc {
  id: string;
  username?: string;
  name?: string;
  role?: string;
  isActive?: boolean;
  expiresAt?: string;
  activeSessionToken?: string;
  guardianName?: string;
  emergencyPhone?: string;
}

export default function UsersAdminPage() {
  const [users, setUsers] = useState<UserDoc[]>([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [daysValid, setDaysValid] = useState("30");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const fetchUsers = async () => {
    try {
      const snap = await getDocs(collection(db, "users"));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() })) as UserDoc[];
      setUsers(list);
    } catch (e) {
      console.warn("Fetch users fallback:", e);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    setLoading(true);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + parseInt(daysValid || "30"));

    try {
      await setDoc(doc(db, "users", username), {
        username,
        password,
        name: name || username,
        role: "user",
        isActive: true,
        guardianName: guardianName || "",
        emergencyPhone: emergencyPhone || "",
        expiresAt: expiresAt.toISOString(),
        createdAt: new Date().toISOString(),
        activeSessionToken: null,
      });

      setUsername(""); setPassword(""); setName("");
      setGuardianName(""); setEmergencyPhone("");
      await fetchUsers();
      setMessage("تم إنشاء المستخدم بنجاح!");
    } catch (e: any) {
      setMessage("حدث خطأ: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForceLogout = async (userDocId: string) => {
    if (!confirm("هل أنت متأكد من طرد الجلسة النشطة لـ " + userDocId + "؟")) return;
    try {
      await updateDoc(doc(db, "users", userDocId), { activeSessionToken: null });
      await fetchUsers();
    } catch (e: any) { alert("فشل الطرد: " + e.message); }
  };

  const handleToggleActive = async (user: UserDoc) => {
    try {
      await updateDoc(doc(db, "users", user.id), { isActive: !user.isActive });
      await fetchUsers();
    } catch (e: any) { alert(e.message); }
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-5xl w-full min-w-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">إدارة المستخدمين والجلسة الواحدة</h1>
        <p className="text-gray-400 text-xs sm:text-sm mt-1">إنشاء حسابات مع بيانات ولي الأمر ورقم الطوارئ ومراقبة الجلسات.</p>
      </div>

      {/* Form */}
      <form onSubmit={handleCreateUser} className="p-4 sm:p-6 bg-dark-800 border border-gray-800 rounded-2xl sm:rounded-3xl space-y-4">
        <h3 className="text-base sm:text-lg font-bold text-gold-400 flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          إنشاء حساب مستخدم جديد
        </h3>

        {message && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-sm font-bold">
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1">اسم المستخدم الكامل (الكفيف)</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="مثال: أحمد محمد علي"
              className="w-full px-4 py-2.5 bg-dark-700 border border-gray-700 rounded-xl text-white text-sm" />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1">اسم الدخول (Username) *</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)}
              placeholder="user1" required
              className="w-full px-4 py-2.5 bg-dark-700 border border-gray-700 rounded-xl text-white text-sm" />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1">كلمة المرور *</label>
            <input type="text" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="123456" required
              className="w-full px-4 py-2.5 bg-dark-700 border border-gray-700 rounded-xl text-white text-sm" />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1">مدة الصلاحية (بالأيام)</label>
            <input type="number" value={daysValid} onChange={e => setDaysValid(e.target.value)}
              className="w-full px-4 py-2.5 bg-dark-700 border border-gray-700 rounded-xl text-white text-sm" />
          </div>

          <div>
            <label className="block text-xs font-bold text-amber-300 mb-1 flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              اسم ولي الأمر / جهة الطوارئ
            </label>
            <input type="text" value={guardianName} onChange={e => setGuardianName(e.target.value)}
              placeholder="مثال: محمد علي (الوالد)"
              className="w-full px-4 py-2.5 bg-dark-700 border border-amber-500/40 rounded-xl text-white text-sm" />
          </div>

          <div>
            <label className="block text-xs font-bold text-amber-300 mb-1 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5" />
              رقم هاتف الطوارئ (واتساب)
            </label>
            <input type="tel" value={emergencyPhone} onChange={e => setEmergencyPhone(e.target.value)}
              placeholder="مثال: 201012345678 (بدون +)"
              className="w-full px-4 py-2.5 bg-dark-700 border border-amber-500/40 rounded-xl text-white text-sm" />
            <span className="text-xs text-gray-500 mt-0.5 block">يستخدم لإرسال موقع الكفيف تلقائياً عبر واتساب عند الطوارئ</span>
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="px-6 py-3 bg-gold-500 hover:bg-gold-600 text-dark-900 font-bold rounded-xl active:scale-95 transition-all">
          {loading ? "جارٍ الإنشاء..." : "إضافة المستخدم مع بيانات الطوارئ"}
        </button>
      </form>

      {/* Users Table */}
      <div className="bg-dark-800 border border-gray-800 rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <h3 className="font-bold text-lg text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-gold-400" />
            قائمة المستخدمين
          </h3>
          <span className="text-xs bg-gold-500/20 text-gold-400 px-3 py-1 rounded-full font-bold">
            {users.length} مستخدم
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-dark-700/50 text-gray-400 font-bold text-xs">
              <tr>
                <th className="p-4">الاسم / الحساب</th>
                <th className="p-4">ولي الأمر / الطوارئ</th>
                <th className="p-4">الحالة</th>
                <th className="p-4">الجلسة النشطة</th>
                <th className="p-4">انتهاء الصلاحية</th>
                <th className="p-4">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-dark-700/20">
                  <td className="p-4">
                    <p className="font-bold text-white">{u.name || u.id}</p>
                    <p className="text-xs text-gray-500 font-mono">@{u.username || u.id}</p>
                  </td>
                  <td className="p-4">
                    {u.guardianName || u.emergencyPhone ? (
                      <div>
                        {u.guardianName && <p className="text-xs text-amber-300 font-bold">{u.guardianName}</p>}
                        {u.emergencyPhone && (
                          <p className="text-xs text-gray-400 font-mono flex items-center gap-1">
                            <Phone className="w-3 h-3" />{u.emergencyPhone}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-red-400">⚠️ لم يُضف بعد</span>
                    )}
                  </td>
                  <td className="p-4">
                    <button onClick={() => handleToggleActive(u)}
                      className={`px-3 py-1 rounded-full text-xs font-bold ${u.isActive !== false ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                      {u.isActive !== false ? "نشط" : "معطل"}
                    </button>
                  </td>
                  <td className="p-4">
                    {u.activeSessionToken ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-bold">
                        <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                        متصل
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500">غير متصل</span>
                    )}
                  </td>
                  <td className="p-4 text-xs text-gray-400">
                    {u.expiresAt ? new Date(u.expiresAt).toLocaleDateString("ar-EG") : "دائم"}
                  </td>
                  <td className="p-4">
                    {u.activeSessionToken && (
                      <button onClick={() => handleForceLogout(u.id)}
                        className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-xl text-xs font-bold flex items-center gap-1">
                        <ShieldX className="w-4 h-4" />
                        طرد فوري
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    لا يوجد مستخدمين بعد. استخدم النموذج أعلاه لإضافة أول مستخدم.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}