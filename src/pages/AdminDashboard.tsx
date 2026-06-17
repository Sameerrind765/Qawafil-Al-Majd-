import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../context/LangContext';
import { TRANSLATIONS } from '../data';
import { Vehicle, CargoOrder, MaintenanceJob, SystemLog, HomepageLead } from '../types';
import { INITIAL_MAINTENANCE_JOBS, INITIAL_LOGS } from '../data';
import { 
  fetchAllVehicles, 
  createOrUpdateVehicle, 
  fetchAllCargoOrders, 
  createOrUpdateCargoOrder,
  fetchAllLeads,
  updateLeadStatus,
  deleteLead
} from '../firebaseService';

// Subcomponents
import FleetMap from '../components/FleetMap';
import DriverChat from '../components/DriverChat';
import AddVehicleModal from '../components/AddVehicleModal';
import CreateOrderModal from '../components/CreateOrderModal';

// Recharts for statistics
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

import { 
  Truck, 
  MapPin, 
  ShieldCheck, 
  Sliders, 
  Plus, 
  Clock, 
  RefreshCw, 
  Layers, 
  DollarSign, 
  Activity, 
  Users, 
  AlertTriangle,
  History, 
  Wrench,
  Sparkles,
  MessageSquare,
  Star,
  X,
  Calendar
} from 'lucide-react';
import { collection, getDocs, doc, query, orderBy, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import AuthScreen from '../components/AuthScreen';

export default function AdminDashboard() {
  const { lang, t } = useLang();
  const tr = TRANSLATIONS[lang];

  // Active dashboard view tab
  const [activeTab, setActiveTab] = useState<'map' | 'roster' | 'orders' | 'maintenance' | 'logs' | 'settings' | 'leads'>('map');

  // Local Auth and Profile states
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [role, setRole] = useState<'superadmin' | 'admin' | 'viewer' | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [deactivatedError, setDeactivatedError] = useState<string | null>(null);

  // Monitor Firebase Auth state change and fetch custom profiles
  useEffect(() => {
    const fetchUserProfile = async (currentUser: User) => {
      setProfileLoading(true);
      setDeactivatedError(null);
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        // Ensure we are operating on the most up-to-date registered user session
        if (currentUser.uid !== auth.currentUser?.uid) return;

        if (userSnap.exists()) {
          const data = userSnap.data();
          if (data.active === false) {
            // deactivation detected! Lock, log out, redirect
            await signOut(auth);
            setUser(null);
            setRole(null);
            setUserData(null);
            setDeactivatedError(
              lang === 'en' 
                ? 'Account deactivated. Contact your administrator.' 
                : 'تم إلغاء تفعيل الحساب. يرجى التواصل مع المدير.'
            );
            return;
          }
          setUserData({ uid: currentUser.uid, ...data });
          setRole(data.role || 'viewer');
        } else {
          // Fallback structure
          const defaultProfile = {
            uid: currentUser.uid,
            email: currentUser.email || '',
            name: currentUser?.displayName || 'Operations Supervisor',
            role: 'viewer',
            active: true,
            createdAt: new Date().toISOString()
          };
          await setDoc(userRef, defaultProfile);
          setUserData(defaultProfile);
          setRole('viewer');
        }
      } catch (err) {
        console.error("Error fetching user profile:", err);
      } finally {
        setProfileLoading(false);
        setAuthLoading(false);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        if (currentUser.emailVerified) {
          fetchUserProfile(currentUser);
        } else {
          setAuthLoading(false);
        }
      } else {
        setUserData(null);
        setRole(null);
        setAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, [lang]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Failed to sign out user:", err);
    }
  };

  // Core Data State
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [orders, setOrders] = useState<CargoOrder[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceJob[]>(INITIAL_MAINTENANCE_JOBS);
  const [logs, setLogs] = useState<SystemLog[]>(INITIAL_LOGS);

  // Leads data state
  const [leads, setLeads] = useState<HomepageLead[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [selectedLead, setSelectedLead] = useState<HomepageLead | null>(null);

  // Lead handlers
  const handleUpdateLeadStatus = async (leadId: string, status: 'Pending' | 'Contacted' | 'Closed') => {
    try {
      await updateLeadStatus(leadId, status);
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status } : l));
    } catch (err) {
      console.error("Failed to update lead status:", err);
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    try {
      await deleteLead(leadId);
      setLeads(prev => prev.filter(l => l.id !== leadId));
    } catch (err) {
      console.error("Failed to delete lead:", err);
    }
  };

  // Dispatchers list (Superadmin exclusive)
  const [adminsList, setAdminsList] = useState<any[]>([]);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  // Form states for Invite Admin
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'viewer'>('admin');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  // Loading indicator & error feedback
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Selected telemetry elements
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  // Dialog Toggles
  const [addVehicleOpen, setAddVehicleOpen] = useState(false);
  const [createOrderOpen, setCreateOrderOpen] = useState(false);

  // Trigger loading of collections from Firestore
  const loadDatabase = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const dbVehicles = await fetchAllVehicles();
      const dbOrders = await fetchAllCargoOrders();
      setVehicles(dbVehicles);
      setOrders(dbOrders);
      
      // Select the first vehicle as default for telemetry HUD
      if (dbVehicles.length > 0 && !selectedVehicle) {
        setSelectedVehicle(dbVehicles[0]);
      }

      setLeadsLoading(true);
      const dbLeads = await fetchAllLeads();
      const getCreatedAtTime = (createdAt: any): number => {
        if (!createdAt) return 0;
        if (typeof createdAt.toDate === 'function') {
          return createdAt.toDate().getTime();
        }
        if (createdAt.seconds !== undefined) {
          return createdAt.seconds * 1000;
        }
        const dateObj = new Date(createdAt);
        return isNaN(dateObj.getTime()) ? 0 : dateObj.getTime();
      };
      const sortedLeads = [...dbLeads].sort((a, b) => getCreatedAtTime(b.createdAt) - getCreatedAtTime(a.createdAt));
      setLeads(sortedLeads);
      setLeadsLoading(false);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Failed to load database. Please verify authorization.");
      setLeadsLoading(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.emailVerified) {
      loadDatabase();
    }
  }, [user]);

  const fetchAdmins = async () => {
    if (role !== 'superadmin') return;
    setAdminsLoading(true);
    try {
      const q = query(collection(db, 'users'));
      const querySnapshot = await getDocs(q);
      const list: any[] = [];
      querySnapshot.forEach((doc) => {
        list.push({ uid: doc.id, ...doc.data() });
      });
      setAdminsList(list);
    } catch (err) {
      console.error("Error loading Admins list:", err);
    } finally {
      setAdminsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'settings' && role === 'superadmin') {
      fetchAdmins();
    }
  }, [activeTab, role]);

  const handleDeactivate = async (targetUid: string) => {
    try {
      const res = await fetch("/api/deactivateAdminUser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: targetUid, superadminUid: userData?.uid })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Deactivation failed.");
      
      const newLog: SystemLog = {
        id: `LOG-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'warning',
        actor: 'Superadmin Terminal',
        message: lang === 'en' 
          ? `Deactivated admin user account ${targetUid}.` 
          : `تم إلغاء تفعيل حساب المأمور ${targetUid}.`
      };
      setLogs(prev => [newLog, ...prev]);
      await fetchAdmins();
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleReactivate = async (targetUid: string) => {
    try {
      const res = await fetch("/api/reactivateAdminUser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: targetUid, superadminUid: userData?.uid })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reactivation failed.");
      
      const newLog: SystemLog = {
        id: `LOG-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'success',
        actor: 'Superadmin Terminal',
        message: lang === 'en' 
          ? `Reactivated admin user account ${targetUid}.` 
          : `تم إعادة تفعيل حساب المأمور ${targetUid}.`
      };
      setLogs(prev => [newLog, ...prev]);
      await fetchAdmins();
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleDelete = async (targetUid: string) => {
    try {
      const res = await fetch("/api/deleteAdminUser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: targetUid, superadminUid: userData?.uid })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Deletion failed.");
      
      const newLog: SystemLog = {
        id: `LOG-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'warning',
        actor: 'Superadmin Terminal',
        message: lang === 'en' 
          ? `Deleted admin user account ${targetUid} from catalog.` 
          : `تم حذف حساب المأمور ${targetUid} نهائيا من الدليل.`
      };
      setLogs(prev => [newLog, ...prev]);
      await fetchAdmins();
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError(null);
    setInviteSuccess(null);
    
    if (!inviteName.trim() || !inviteEmail.trim()) {
      setInviteError(lang === 'en' ? "All fields are required" : "يرجى ملء كافة الخانات المطلوبة");
      return;
    }

    setInviteLoading(true);

    try {
      const res = await fetch("/api/createAdminUser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          name: inviteName.trim(),
          role: inviteRole,
          superadminUid: userData?.uid
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to invite new user credentials.");
      }

      setInviteSuccess(
        lang === 'en'
          ? `Successfully invited Salem! Password activation link created: ${data.resetLink || 'sent via email'}`
          : `تم دعوة المأمور بنجاح! رابط التفعيل الخاص به: ${data.resetLink || 'تم إرساله بالبريد'}`
      );
      
      setInviteName('');
      setInviteEmail('');
      setInviteRole('admin');
      
      const newLog: SystemLog = {
        id: `LOG-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'success',
        actor: 'Superadmin Terminal',
        message: lang === 'en' 
          ? `Invited new ${inviteRole} account: ${inviteEmail}` 
          : `تم دعوة حساب ${inviteRole} جديد: ${inviteEmail}`
      };
      setLogs(prev => [newLog, ...prev]);
      await fetchAdmins();
    } catch (err: any) {
      setInviteError(err.message || "Error creating dispatcher account");
    } finally {
      setInviteLoading(false);
    }
  };

  // Save changes to vehicles
  const handleSaveVehicle = async (newVehicle: Vehicle) => {
    try {
      await createOrUpdateVehicle(newVehicle);
      // Append logs
      const newLog: SystemLog = {
        id: `LOG-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'success',
        actor: 'Systems Management',
        message: lang === 'en' 
          ? `Added new transport asset ${newVehicle.id} (${newVehicle.type}) to dynamic lineup.` 
          : `تم إضافة الناقلة رقم ${newVehicle.id} (${newVehicle.type}) في الأسطول اللوجستي الدائم.`
      };
      setLogs(prev => [newLog, ...prev]);
      setAddVehicleOpen(false);
      // Refresh
      await loadDatabase();
    } catch (err: any) {
      alert(lang === 'en' ? "Error saving asset to Firestore Rules." : "خطأ أمني أثناء محاولة حفظ المركبة.");
    }
  };

  // Update a vehicle's operational status instantly
  const handleUpdateVehicleStatus = async (vId: string, nextStatus: Vehicle['status']) => {
    const updated = vehicles.map(v => {
      if (v.id === vId) {
        return { ...v, status: nextStatus };
      }
      return v;
    });
    setVehicles(updated);
    
    const target = updated.find(v => v.id === vId);
    if (target) {
      try {
        await createOrUpdateVehicle(target);
        // Add info log
        const newLog: SystemLog = {
          id: `LOG-${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: 'info',
          actor: 'Operations Team',
          message: lang === 'en'
            ? `Vehicle ${vId} changed state to [${nextStatus}].`
            : `الناقلة ${vId} تحولت حالتها التشغيلية إلى [${nextStatus}].`
        };
        setLogs(prev => [newLog, ...prev]);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Save changes to orders
  const handleSaveOrder = async (newOrder: CargoOrder) => {
    try {
      await createOrUpdateCargoOrder(newOrder);
      // Append logs
      const newLog: SystemLog = {
        id: `LOG-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'success',
        actor: 'Automatic Billing',
        message: lang === 'en' 
          ? `Drafted shipping assignment ${newOrder.id} (${newOrder.cargoType}) costing SAR ${newOrder.estimatedPrice}.`
          : `برمجة شحنة الشحن البري ${newOrder.id} بمبلغ ${newOrder.estimatedPrice} ريال سعودي.`
      };
      setLogs(prev => [newLog, ...prev]);
      setCreateOrderOpen(false);
      await loadDatabase();
    } catch (err: any) {
      alert("Unauthorized Firestore deployment rule.");
    }
  };

  // Update an order's consignment status instantly
  const handleUpdateOrderStatus = async (oId: string, nextStatus: CargoOrder['status']) => {
    const updated = orders.map(o => {
      if (o.id === oId) {
        return { ...o, status: nextStatus };
      }
      return o;
    });
    setOrders(updated);

    const target = updated.find(o => o.id === oId);
    if (target) {
      try {
        await createOrUpdateCargoOrder(target);
        const newLog: SystemLog = {
          id: `LOG-${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: 'success',
          actor: 'Audit Controller',
          message: lang === 'en'
            ? `Cargo manifest ${oId} updated state to [${nextStatus}].`
            : `تم تعديل حالة بوليصة الشحنة ${oId} إلى [${nextStatus}].`
        };
        setLogs(prev => [newLog, ...prev]);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Stats Counters
  const transitCount = vehicles.filter(v => v.status === 'In Transit').length;
  const standbyCount = vehicles.filter(v => v.status === 'Available').length;
  const maintenanceCount = vehicles.filter(v => v.status === 'Maintenance').length;
  
  const estimatedRevenue = orders
    .filter(o => o.status !== 'Cancelled')
    .reduce((accumulation, o) => accumulation + o.estimatedPrice, 0);

  // Today's Trips KPI calculation (using client-side local date)
  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const date = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${date}`;
  };
  const todayStr = getTodayString();
  const todayTripsCount = leads.filter(l => l.date === todayStr).length;

  // Chart Formatting: Revenue distribution by Destination Industrial Hub
  const getCityRevenueData = () => {
    const revenueMap: Record<string, number> = {};
    orders.forEach(o => {
      if (o.status !== 'Cancelled') {
        revenueMap[o.destination] = (revenueMap[o.destination] || 0) + o.estimatedPrice;
      }
    });
    return Object.keys(revenueMap).map(key => ({
      destination: key,
      Revenue: revenueMap[key]
    }));
  };

  // Fuel level layout distribution counts for Pie charts
  const getFuelPieData = () => {
    let low = 0; // < 40%
    let mid = 0; // 40-75%
    let full = 0; // > 75%
    vehicles.forEach(v => {
      if (v.fuelLevel < 40) low++;
      else if (v.fuelLevel <= 75) mid++;
      else full++;
    });
    return [
      { name: lang === 'en' ? 'Critical (<40%)' : 'إنذار وقود منخفض', value: low, color: '#f43f5e' },
      { name: lang === 'en' ? 'Normal (40-75%)' : 'وقود متوسط', value: mid, color: '#eab308' },
      { name: lang === 'en' ? 'Optimal (>75%)' : 'وقود كافٍ', value: full, color: '#10b981' }
    ].filter(item => item.value > 0);
  };

  // ----------------------------------------------------
  // Authentication & Verification check-screens (inline inside Dashboard tab context)
  // ----------------------------------------------------
  if (authLoading || (user && user.emailVerified && !role && profileLoading)) {
    return (
      <div className="flex-1 bg-[#111622] text-white flex flex-col items-center justify-center font-sans gap-4 py-32" id="admin-auth-loading-hud">
        <div className="w-12 h-12 rounded-xl bg-[#C0272D] flex items-center justify-center text-white font-bold border border-rose-950/10 shadow-lg shadow-[#C0272D]/10 animate-bounce">
          <Truck className="w-7 h-7" />
        </div>
        <div className="w-6 h-6 rounded-full border-2 border-slate-700 border-t-[#C0272D] animate-spin" />
        <p className="text-xs font-bold text-rose-100 uppercase tracking-widest font-mono">
          {lang === 'en' ? 'Authenticating secure link...' : 'تحميل البوابة الأمنة لنقل الركاب...'}
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <AuthScreen 
        lang={lang === 'ar' ? 'ar' : 'en'} 
        setLang={() => {}} 
        onSuccess={() => {}} 
        initialErrorMessage={deactivatedError}
      />
    );
  }

  if (user && !user.emailVerified) {
    return (
      <AuthScreen 
        lang={lang === 'ar' ? 'ar' : 'en'} 
        setLang={() => {}} 
        unverifiedUserEmail={user.email}
        onLogout={handleLogout}
        onSuccess={() => {}}
      />
    );
  }

  return (
    <div className="flex-1 bg-slate-50 font-sans select-none pb-16">
      
      {/* 1. TOP HEADER BANNER BAR */}
      <div className="bg-brand-bg-dark text-white px-4 sm:px-6 lg:px-8 py-10 relative overflow-hidden">
        {/* Visual slate background overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-brand-black via-slate-900 to-rose-950/20 opacity-80" />
        <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-brand-primary opacity-5 filter blur-3xl animate-pulse" />
        
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-primary" />
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-[#da291c]">
                {tr.brandSub}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1">
              🛠️ {tr.dashboard}
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
              <p className="text-xs text-slate-400 font-semibold">
                Saudi Land Transportation & Cargo Management Control Desk
              </p>
              {userData && (
                <span className="text-[10px] bg-slate-800 text-slate-300 font-bold px-2 py-0.5 rounded border border-slate-700">
                  {lang === 'en' ? `Logged in: ${userData.name || 'Dispatcher'} (${role === 'superadmin' ? 'Superadmin' : role === 'admin' ? 'Coordinator' : 'Observer'})` : `مسجل كـ: ${userData.name || 'مأمور'} (${role === 'superadmin' ? 'مدير عام' : role === 'admin' ? 'منسق' : 'مراقب'})`}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Invite button (Highly requested - displays for Superadmins) */}
            {role === 'superadmin' && (
              <button
                type="button"
                onClick={() => setInviteModalOpen(true)}
                className="bg-[#C0272D] hover:opacity-95 text-white border-0 px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all duration-250 shadow-md shadow-red-700/10"
                id="header-invite-admin-trigger-btn"
              >
                <Plus className="w-3.5 h-3.5 text-white" />
                <span>{lang === 'en' ? 'Invite Dispatcher' : 'دعوة مأمور جديد'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={loadDatabase}
              className="bg-white/10 border border-white/10 hover:bg-white/20 text-white px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all duration-205"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{lang === 'en' ? 'Sync Databases' : 'تحديث البيانات'}</span>
            </button>

            {/* Link back to public site */}
            <Link
              to="/"
              className="bg-white/5 border border-white/10 hover:bg-white/15 text-slate-200 px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all duration-200 decoration-transparent"
              id="header-gohome-btn"
            >
              <span>{lang === 'en' ? 'Public Site' : 'الموقع العام'}</span>
            </Link>

            {/* Logout button */}
            <button
              type="button"
              onClick={handleLogout}
              className="bg-slate-800/80 hover:bg-slate-850/90 text-rose-400 hover:text-rose-350 border border-slate-700/80 px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all duration-200"
              id="header-logout-btn"
            >
              <span>{lang === 'en' ? 'Log Out' : 'خروج'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-30">
        
        {/* Error Feedback alert if things crash */}
        {errorMessage && (
          <div className="mb-6 bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-500 mt-0.5 shrink-0" />
            <div>
              <h4 className="text-xs font-extrabold text-rose-800 uppercase tracking-wider">
                Firestore Access Validation Alarm
              </h4>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* 2. STATS OVERVIEW CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          
          {/* Active Trips cargo lanes */}
          <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] text-slate-400 uppercase font-extrabold tracking-wider">
                {tr.activeShipments}
              </span>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <Truck className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 leading-none">
              {transitCount}
            </p>
            <p className="text-[10px] text-slate-400 font-semibold mt-2">
              {lang === 'en' ? 'Active vehicles on Saudi road-lanes' : 'حفارات، صهاريج وشاحنات نشطة'}
            </p>
          </div>

          {/* Standby fleets ready */}
          <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] text-slate-400 uppercase font-extrabold tracking-wider">
                {tr.availableFleets}
              </span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <Activity className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 leading-none">
              {standbyCount}
            </p>
            <p className="text-[10px] text-emerald-600 font-semibold mt-2">
              ● {lang === 'en' ? 'Ready to allocate' : 'جاهزة للتوظيف الفوري'}
            </p>
          </div>

          {/* "Today's Trips" KPI Card */}
          <div className="bg-white border border-slate-150 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border-l-4 border-l-[#C0272D]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] text-[#C0272D] uppercase font-black tracking-wider">
                {lang === 'en' ? "Today's Trips" : "رحلات اليوم"}
              </span>
              <div className="p-2 rounded-xl bg-rose-50 text-[#C0272D]">
                <Calendar className="w-5 h-5 animate-pulse" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-950 leading-none">
              {todayTripsCount}
            </p>
            <p className="text-[10px] text-slate-400 font-bold mt-2 font-mono" dir="ltr">
              ⏱ {todayStr}
            </p>
          </div>

          {/* Maintenance alert warning status */}
          <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] text-slate-400 uppercase font-extrabold tracking-wider">
                {tr.criticalAlerts}
              </span>
              <div className="p-2 rounded-xl bg-rose-50 text-rose-600 animate-pulse">
                <Wrench className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 leading-none">
              {maintenanceCount}
            </p>
            <p className="text-[10px] text-rose-500 font-semibold mt-2">
              ⚠ In Workshop Service
            </p>
          </div>

          {/* Revenue metrics calculation */}
          <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] text-slate-400 uppercase font-extrabold tracking-wider">
                Freight Revenue Lock
              </span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <p className="text-1xl sm:text-2xl md:text-3xl font-black text-slate-900 leading-none font-mono">
              {estimatedRevenue.toLocaleString()} <span className="text-xs font-bold text-slate-400 font-sans">{tr.priceCurrency}</span>
            </p>
            <p className="text-[10px] text-slate-400 font-semibold mt-2">
              {lang === 'en' ? 'Sum of cumulative estimated orders' : 'مجموع إيرادات شحنات الأسطول'}
            </p>
          </div>

        </div>

        {/* 3. CHART & TELEMETRY NAVIGATION TAB STRIP */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-200 pb-3.5 mb-6 gap-4">
          <div className="flex flex-wrap items-center gap-1.5" id="dashboard-nav-pills">
            <button
              onClick={() => setActiveTab('map')}
              className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                activeTab === 'map' ? 'bg-blue-700 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-750 hover:bg-slate-50'
              }`}
            >
              📡 {lang === 'en' ? 'Live Telemetry & VHF' : 'الراصد والاتصال'}
            </button>
            <button
              onClick={() => setActiveTab('roster')}
              className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                activeTab === 'roster' ? 'bg-blue-700 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-750 hover:bg-slate-50'
              }`}
            >
              🚛 {tr.fleetRoster}
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                activeTab === 'orders' ? 'bg-blue-700 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-750 hover:bg-slate-50'
              }`}
            >
              📦 {tr.orderBooking}
            </button>
            <button
              onClick={() => setActiveTab('maintenance')}
              className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                activeTab === 'maintenance' ? 'bg-blue-700 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-755 hover:bg-slate-50'
              }`}
            >
              🔧 {tr.maintenance}
            </button>
            <button
              onClick={() => setActiveTab('leads')}
              className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                activeTab === 'leads' ? 'text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-755 hover:bg-slate-50'
              }`}
              style={activeTab === 'leads' ? { backgroundColor: '#D97706' } : {}}
            >
              ⭐ {lang === 'en' ? 'Pilgrim Inquiries' : 'طلبات واستمارات المعتمرين'}
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                activeTab === 'logs' ? 'bg-blue-700 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-750 hover:bg-slate-50'
              }`}
            >
              📋 {tr.systemLogs}
            </button>
            {role === 'superadmin' && (
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                  activeTab === 'settings' ? 'text-white shadow-sm font-extrabold' : 'bg-white border border-slate-200 text-slate-750 hover:bg-slate-50'
                }`}
                style={activeTab === 'settings' ? { backgroundColor: '#C0272D' } : {}}
              >
                ⚙ {lang === 'en' ? 'Team Settings' : 'إعدادات الفريق والمدراء'}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {role !== 'viewer' && (
              <>
                <button
                  type="button"
                  onClick={() => setAddVehicleOpen(true)}
                  className="bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm shadow-blue-700/10 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{lang === 'en' ? 'Add Truck Asset' : 'تسجيل ناقلة بالأسطول'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCreateOrderOpen(true)}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm shadow-amber-600/10 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{lang === 'en' ? 'Dispatch Cargo' : 'توجيه شحنة نقل'}</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* 4. ACTIVE SUBVIEWS AND CONTROLLERS */}

        {/* TAB 1: TELEMETRY SYSTEM map & chat */}
        {activeTab === 'map' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* Telemetry map representing paths inside Saudi coordinates */}
              <div className="lg:col-span-8 flex flex-col h-full">
                <FleetMap
                  vehicles={vehicles}
                  selectedVehicle={selectedVehicle}
                  onSelectVehicle={setSelectedVehicle}
                  lang={lang}
                />
              </div>

              {/* Dynamic VHF Radio Chat with drivers */}
              <div className="lg:col-span-4 flex flex-col h-full">
                <DriverChat
                  vehicles={vehicles}
                  selectedVehicle={selectedVehicle}
                  lang={lang}
                />
              </div>
            </div>

            {/* Industrial Logistics Statistics Breakdown Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Revenue Chart per destination */}
              <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm">
                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-4 border-l-2 border-blue-600 pl-2">
                  {tr.statsChartTitle}
                </h4>
                <div className="h-[280px] w-full text-slate-600 font-bold text-[11px]">
                  {getCityRevenueData().length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={getCityRevenueData()}>
                        <XAxis dataKey="destination" stroke="#475569" />
                        <YAxis stroke="#475569" />
                        <Tooltip formatter={(value) => [`${Number(value).toLocaleString()} SAR`, 'Revenue']} />
                        <Bar dataKey="Revenue" fill="#1e3a8a" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400">
                      No matching cargo orders processed yet
                    </div>
                  )}
                </div>
              </div>

              {/* Fuel Level Distribution Indicators */}
              <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-4 border-l-2 border-emerald-500 pl-2">
                    {lang === 'en' ? 'Fleet Fuel Integrity Index' : 'مؤشرات كفاءة ومخزون وقود الأسطول'}
                  </h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-4">
                  <div className="md:col-span-6 h-[200px]" id="fuel-recharts-chart">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={getFuelPieData()}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {getFuelPieData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="md:col-span-6 space-y-2 mt-4 md:mt-0">
                    {getFuelPieData().map((entry, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs font-bold text-slate-700">
                        <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: entry.color }} />
                        <span className="flex-1 font-semibold">{entry.name}:</span>
                        <span className="font-mono text-slate-900">{entry.value} rigs</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 2: VEHICLE AND TRUCK ROSTER TABLE */}
        {activeTab === 'roster' && (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">
                    <th className="py-4 px-6 font-semibold">{tr.brandName} ID</th>
                    <th className="py-4 px-6 font-semibold">{tr.plateText}</th>
                    <th className="py-4 px-6 font-semibold">{lang === 'en' ? 'Asset Type' : 'نوع المعدة'}</th>
                    <th className="py-4 px-6 font-semibold">{tr.driver}</th>
                    <th className="py-4 px-6 font-semibold">{tr.capacity}</th>
                    <th className="py-4 px-6 font-semibold">{tr.fuel}</th>
                    <th className="py-4 px-6 font-semibold">{tr.status}</th>
                    <th className="py-4 px-6 font-semibold">{tr.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                  {vehicles.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/55 transition-colors">
                      <td className="py-4 px-6 font-bold font-mono text-blue-700">{v.id}</td>
                      <td className="py-4 px-6 font-bold text-slate-900 uppercase tracking-widest">{v.plateNumber}</td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-lg bg-slate-50 text-slate-800 border border-slate-200 text-[10px] font-bold uppercase">
                          {v.type}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-bold text-slate-900">{v.driverName}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{v.driverPhone}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-600 font-mono">{v.capacity}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className={`h-2.5 w-10 bh-slate-200 rounded-full inline-block relative overflow-hidden flex bg-slate-100 border border-slate-200`}>
                            <span 
                              className={`h-full inline-block rounded-full ${
                                v.fuelLevel < 40 ? 'bg-rose-500' : v.fuelLevel <= 75 ? 'bg-amber-400' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${v.fuelLevel}%` }}
                            />
                          </span>
                          <span className="font-mono text-[10px] font-bold text-slate-500">{v.fuelLevel}%</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase font-mono ${
                          v.status === 'Available' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          v.status === 'In Transit' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          v.status === 'Maintenance' ? 'bg-rose-50 text-rose-700 border border-rose-250' : 'bg-slate-100 text-slate-600'
                        }`}>
                          ● {v.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-bold">
                        <select
                          value={v.status}
                          disabled={role === 'viewer'}
                          onChange={(e) => handleUpdateVehicleStatus(v.id, e.target.value as any)}
                          className="bg-white border border-slate-200 rounded-lg p-1 text-[10px] font-bold focus:outline-none focus:border-blue-500 cursor-pointer disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                        >
                          <option value="Available">Available</option>
                          <option value="In Transit">In Transit</option>
                          <option value="Maintenance">Maintenance</option>
                          <option value="Off Duty">Off Duty</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: CARGO FREIGHT BOOKINGS / LANES LIST */}
        {activeTab === 'orders' && (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">
                    <th className="py-4 px-6 font-semibold">Manifest ID</th>
                    <th className="py-4 px-6 font-semibold">{lang === 'en' ? 'Client' : 'العميل'}</th>
                    <th className="py-4 px-6 font-semibold">{tr.chooseType}</th>
                    <th className="py-4 px-6 font-semibold">{tr.trackShipment}</th>
                    <th className="py-4 px-6 font-semibold">{tr.weightVol}</th>
                    <th className="py-4 px-6 font-semibold">{tr.estimatedPrice}</th>
                    <th className="py-4 px-6 font-semibold">{tr.status}</th>
                    <th className="py-4 px-6 font-semibold">{tr.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50/55 transition-colors">
                      <td className="py-4 px-6 font-bold font-mono text-amber-700">{o.id}</td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-bold text-slate-900">{o.clientName}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{o.clientPhone}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-650">{o.vehicleType}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 font-bold select-none text-slate-800">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px]">{o.origin}</span>
                          <span className="text-slate-400">➔</span>
                          <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px]">{o.destination}</span>
                        </div>
                        <p className="text-[9px] text-slate-400 uppercase font-bold mt-1 tracking-tight">{o.cargoType}</p>
                      </td>
                      <td className="py-4 px-6 font-mono text-slate-500 font-bold">{o.weightOrVolume}</td>
                      <td className="py-4 px-6 font-bold font-mono text-slate-900">
                        {o.estimatedPrice.toLocaleString()} {tr.currency}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase font-mono ${
                          o.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          o.status === 'In Transit' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          o.status === 'Assigned' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                          o.status === 'Pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          ● {o.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-bold">
                        <select
                          value={o.status}
                          disabled={role === 'viewer'}
                          onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value as any)}
                          className="bg-white border border-slate-200 rounded-lg p-1 text-[10px] font-bold focus:outline-none focus:border-blue-500 cursor-pointer disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Assigned">Assigned</option>
                          <option value="In Transit">In Transit</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: WORKSHOP AND REPAIR MAINTENANCE */}
        {activeTab === 'maintenance' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {maintenance.map((m) => (
              <div key={m.id} className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between" id={`maintenance-job-${m.id}`}>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                      {m.id} • {m.date}
                    </span>
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                      m.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                    }`}>
                      {m.status}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-[#374151]">
                      {m.vehicleId} | {m.vehicleType}
                    </h4>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {tr.plateText}: {m.plateNumber}
                    </p>
                  </div>
                  <p className="text-xs text-slate-600 font-semibold bg-rose-50/20 p-2.5 rounded-xl border border-rose-100/20">
                    🔧 {m.issue}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-slate-50 pt-4 mt-4 text-xs font-bold">
                  <span className="text-slate-500">Servicing Invoice Cost:</span>
                  <span className="text-slate-900 font-mono text-sm">
                    SAR {m.cost.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 5: SYSTEM SECURITY AND EVENT AUDIT LOGS */}
        {activeTab === 'logs' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 font-mono">
              Terminal Audit Telemetry logs
            </h3>
            <div className="space-y-4 max-h-[500px] overflow-y-auto">
              {logs.map((log) => (
                <div key={log.id} className="flex gap-3 text-xs items-start border-b border-slate-50 pb-3" id={`audit-log-${log.id}`}>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase mt-0.5 ${
                    log.type === 'success' ? 'bg-emerald-50 text-emerald-700' :
                    log.type === 'warning' ? 'bg-rose-50 text-rose-700' : 'bg-blue-50 text-blue-700'
                  }`}>
                    {log.type}
                  </span>
                  <div className="flex-1">
                    <p className="font-bold text-slate-800">{log.message}</p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                      Actor Node: {log.actor} • Timestamp: <span className="font-mono">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: LEADS (Homepage Form submissions) */}
        {activeTab === 'leads' && (
          <div className="space-y-6 animate-fadeIn" id="pilgrim-leads-tab-view">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                  <span>{lang === 'en' ? 'Pilgrim Booking Requests (Collected leads)' : 'طلبات واستمارات المعتمرين'}</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium font-sans">
                  {lang === 'en' ? 'Live inquiries received from the 30-second homepage wizard.' : 'الطلبات المباشرة الواردة من نموذج الطلب السريع بالصفحة الرئيسية لشركة قوافل المجد.'}
                </p>
              </div>
              <button
                onClick={async () => {
                  setLeadsLoading(true);
                  const fresh = await fetchAllLeads();
                  setLeads(fresh);
                  setLeadsLoading(false);
                }}
                disabled={leadsLoading}
                className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${leadsLoading ? 'animate-spin' : ''}`} />
                <span>{lang === 'en' ? 'Refresh Submissions' : 'تحديث الطلبات'}</span>
              </button>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-amber-50/50 border border-amber-200/60 rounded-2xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-lg">
                  {leads.filter(l => l.status === 'Pending').length}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-900 uppercase">
                    {lang === 'en' ? 'Pending Action' : 'طلب قيد المعالجة'}
                  </h4>
                  <p className="text-[10px] text-slate-500 font-medium">
                    {lang === 'en' ? 'Immediate reply needed' : 'يتطلب تواصل ومأمور فعال'}
                  </p>
                </div>
              </div>

              <div className="bg-blue-50/50 border border-blue-200/60 rounded-2xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
                  {leads.filter(l => l.status === 'Contacted').length}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-blue-950 uppercase">
                    {lang === 'en' ? 'Contacted / Active' : 'تم التواصل / قيد المتابعة'}
                  </h4>
                  <p className="text-[10px] text-slate-500 font-medium">
                    {lang === 'en' ? 'In WhatsApp chat' : 'في مرحلة الاتفاق والتفريج'}
                  </p>
                </div>
              </div>

              <div className="bg-emerald-50/50 border border-emerald-200/60 rounded-2xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg">
                  {leads.filter(l => l.status === 'Closed').length}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-950 uppercase">
                    {lang === 'en' ? 'Closed / Confirmed' : 'تم التأكيد والإغلاق'}
                  </h4>
                  <p className="text-[10px] text-slate-500 font-medium">
                    {lang === 'en' ? 'Pilgrim journey secured' : 'تم جدولة السائق المباشر'}
                  </p>
                </div>
              </div>
            </div>

            {/* Main leads content */}
            {leadsLoading ? (
              <div className="py-12 text-center" id="leads-loading-hub">
                <span className="w-8 h-8 border-4 border-[#C0272D] border-t-transparent rounded-full animate-spin inline-block"></span>
                <p className="text-xs text-slate-500 font-bold mt-2">
                  {lang === 'en' ? 'Loading customer forms from cloud database...' : 'جاري سحب واجهة استمارات المعتمرين...'}
                </p>
              </div>
            ) : leads.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center" id="leads-empty-hub">
                <p className="text-slate-400 font-bold text-sm">
                  {lang === 'en' ? 'No homepage form submissions have been recorded yet.' : 'لم يتم تسجيل أي طلبات حجوزات عبر واجهة الموقع حتى الآن.'}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {lang === 'en' ? 'Submissions from the homepage landing card will appear here automatically.' : 'استمارات الطلب السريعة تظهر مباشرة ومؤتمتة هنا فور تعبئتها.'}
                </p>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm" id="leads-table-container">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">
                        <th className="py-4 px-6 font-semibold">{lang === 'en' ? 'Inquiry ID' : 'معرف الطلب'}</th>
                        <th className="py-4 px-6 font-semibold">{lang === 'en' ? 'Pilgrim / Coordinator' : 'العميل'}</th>
                        <th className="py-4 px-6 font-semibold">{lang === 'en' ? 'WhatsApp Number' : 'رقم الواتساب'}</th>
                        <th className="py-4 px-6 font-semibold">{lang === 'en' ? 'Service & Carrier' : 'الخدمة / الناقلة'}</th>
                        <th className="py-4 px-6 font-semibold">{lang === 'en' ? 'Date & Time' : 'تاريخ ووقت السفر'}</th>
                        <th className="py-4 px-6 font-semibold">{lang === 'en' ? 'Status' : 'الحالة'}</th>
                        <th className="py-4 px-6 font-semibold text-center">{lang === 'en' ? 'Actions' : 'الإجراءات'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-750">
                      {leads.map((lead) => {
                        const statusColors = {
                          Pending: 'bg-amber-100 text-amber-800 border-amber-200',
                          Contacted: 'bg-blue-100 text-blue-800 border-blue-200',
                          Closed: 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        };
                        
                        // Helper WhatsApp url for dispatcher
                        const dispatchMsg = lang === 'en'
                          ? `Assalamu Alaikum ${lead.name}, this is Qawafil Al Majd dispatch control desk. We received your quick request for "${lead.service}" using "${lead.caravan}" on date "${lead.date || '—'}" at time "${lead.time || '—'}". We are ready to dispatch your driver.`
                          : `السلام عليكم يا ${lead.name}، معكم مركز العمليات لشركة قوافل المجد لخدمات المعتمرين وزوار معالم الحرم. تلقينا طلب رحلتكم لـ "${lead.service}" باستخدام "${lead.caravan}" بتاريخ "${lead.date || '—'}" ووقت "${lead.time || '—'}". نود تأكيد تفريج العربة لكم وربطكم بالسائق.`;
                        
                        const waUrl = `https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(dispatchMsg)}`;

                        // Formatter for Date & Time
                        const formatBookingDateTime = (dateStr?: string, timeStr?: string) => {
                          if (!dateStr) return '—';
                          
                          let dateFormatted = dateStr;
                          try {
                            const parts = dateStr.split('-');
                            if (parts.length === 3) {
                              const year = parts[0];
                              const monthIndex = parseInt(parts[1], 10) - 1;
                              const day = parseInt(parts[2], 10);
                              const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                              if (monthIndex >= 0 && monthIndex < 12) {
                                dateFormatted = `${day} ${months[monthIndex]} ${year}`;
                              }
                            } else {
                              const parsedDate = new Date(dateStr);
                              if (!isNaN(parsedDate.getTime())) {
                                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                dateFormatted = `${parsedDate.getDate()} ${months[parsedDate.getMonth()]} ${parsedDate.getFullYear()}`;
                              }
                            }
                          } catch (e) {
                            dateFormatted = dateStr;
                          }

                          let timeFormatted = timeStr || '';
                          if (timeStr) {
                            try {
                              const timeParts = timeStr.split(':');
                              if (timeParts.length >= 2) {
                                let hour = parseInt(timeParts[0], 10);
                                const min = timeParts[1];
                                const ampm = hour >= 12 ? 'PM' : 'AM';
                                hour = hour % 12;
                                hour = hour ? hour : 12; 
                                const hourStr = String(hour).padStart(2, '0');
                                timeFormatted = `${hourStr}:${min} ${ampm}`;
                              }
                            } catch (e) {
                              timeFormatted = timeStr;
                            }
                          }

                          return timeFormatted ? `${dateFormatted} · ${timeFormatted}` : `${dateFormatted} · —`;
                        };

                        return (
                          <tr 
                            key={lead.id} 
                            className="hover:bg-slate-50/55 cursor-pointer transition-colors"
                            onClick={() => setSelectedLead(lead)}
                          >
                            <td className="py-4 px-6 font-mono text-[11px] text-slate-500">
                              #{lead.id.substring(5, 11)}
                            </td>
                            <td className="py-4 px-6 font-extrabold text-slate-950">
                              {lead.name}
                            </td>
                            <td className="py-4 px-6 font-mono" dir="ltr">
                              {lead.phone}
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-slate-800 text-xs font-bold leading-normal">{lead.service}</span>
                                <span className="text-[10px] text-slate-400 font-extrabold font-mono tracking-wide">{lead.caravan}</span>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-slate-600 font-mono text-[11px]">
                              {!lead.date ? '—' : formatBookingDateTime(lead.date, lead.time)}
                            </td>
                            <td className="py-4 px-6" onClick={(e) => e.stopPropagation()}>
                              <select
                                value={lead.status}
                                onChange={(e) => handleUpdateLeadStatus(lead.id, e.target.value as any)}
                                className={`text-[10px] font-black py-1 px-2.5 rounded-lg border outline-none cursor-pointer ${statusColors[lead.status]}`}
                              >
                                <option value="Pending">{lang === 'en' ? '⏳ Pending' : '⏳ قيد المعالجة'}</option>
                                <option value="Contacted">{lang === 'en' ? '💬 Contacted' : '💬 تم الاتصال'}</option>
                                <option value="Closed">{lang === 'en' ? '✅ Closed' : '✅ رحلة مؤكدة'}</option>
                              </select>
                            </td>
                            <td className="py-4 px-6 text-center" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => setSelectedLead(lead)}
                                  className="text-[#C0272D] hover:bg-rose-50/60 font-black px-2.5 py-1.5 rounded-lg transition"
                                  id={`view-details-btn-${lead.id}`}
                                >
                                  👁️ {lang === 'en' ? 'View details' : 'عرض التفاصيل'}
                                </button>
                                
                                <a 
                                  href={waUrl}
                                  target="_blank"
                                  referrerPolicy="no-referrer"
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                                >
                                  <span>WhatsApp</span>
                                </a>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteLead(lead.id)}
                                  className="text-rose-600 hover:text-rose-700 font-bold p-1 rounded hover:bg-rose-50 transition"
                                  title="Delete submission"
                                >
                                  🗑
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Booking Detail Modal/Drawer */}
        {selectedLead && (
          <div 
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setSelectedLead(null)}
          >
            <div 
              className="bg-white rounded-2xl shadow-xl border border-rose-50 max-w-lg w-full overflow-hidden transform transition-all text-slate-800"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-brand-bg-dark text-white px-6 py-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                  <h3 className="text-sm font-extrabold tracking-tight">
                    {lang === 'en' ? 'Pilgrim Booking Details' : 'تفاصيل طلب حجز المعتمر'}
                  </h3>
                </div>
                <button 
                  type="button"
                  onClick={() => setSelectedLead(null)}
                  className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4 text-xs font-bold text-slate-700">
                <div className="grid grid-cols-2 gap-4 pb-4 border-b border-rose-50">
                  <div>
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase block">{lang === 'en' ? 'Booking Reference' : 'رقم المرجع للطلب'}</span>
                    <span className="font-mono text-xs font-bold text-slate-900 mt-0.5 block">#{selectedLead.id.substring(5, 14)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase block">{lang === 'en' ? 'Submitted Date' : 'تاريخ تقديم الطلب'}</span>
                    <span className="text-xs font-bold text-slate-750 mt-0.5 block">
                      {(() => {
                        const createdAt = selectedLead.createdAt;
                        if (!createdAt) return '—';
                        let dateObj: Date;
                        if (typeof createdAt.toDate === 'function') {
                          dateObj = createdAt.toDate();
                        } else if (createdAt.seconds !== undefined) {
                          dateObj = new Date(createdAt.seconds * 1000);
                        } else {
                          dateObj = new Date(createdAt);
                        }
                        if (isNaN(dateObj.getTime())) return '—';
                        return dateObj.toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US');
                      })()}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase block">{lang === 'en' ? 'Pilgrim Name' : 'اسم المعتمر / المنسق'}</span>
                    <p className="text-sm text-slate-950 font-black mt-0.5">{selectedLead.name}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase block">{lang === 'en' ? 'WhatsApp Contact' : 'رقم الواتساب المتصل'}</span>
                    <p className="text-sm text-slate-950 font-bold mt-0.5 font-mono" dir="ltr">{selectedLead.phone}</p>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-rose-50">
                  <div>
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase block">{lang === 'en' ? 'Requested Service Program' : 'البرنامج والخدمة البرية المطلوبة'}</span>
                    <p className="text-xs text-slate-950 font-black mt-0.5 bg-rose-50/50 p-2.5 rounded-lg border border-rose-100/30">{selectedLead.service}</p>
                  </div>
                  <div className="pt-2">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase block">{lang === 'en' ? 'Assigned Vehicle Fleet' : 'فئة ونوع الناقلة المفضلة'}</span>
                    <p className="text-xs text-slate-950 font-black mt-0.5">{selectedLead.caravan}</p>
                  </div>
                </div>

                {/* Travel Date and Departure Time clearly labeled */}
                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-rose-50">
                  <div>
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase block">
                      {lang === 'en' ? 'Travel Date' : 'تاريخ السفر'}
                    </span>
                    <p className="text-xs text-[#C0272D] font-black mt-0.5 bg-slate-50 p-2.5 rounded-xl border border-slate-205">
                      📅 {selectedLead.date || '—'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase block">
                      {lang === 'en' ? 'Departure Time' : 'وقت المغادرة'}
                    </span>
                    <p className="text-xs text-[#C0272D] font-black mt-0.5 bg-slate-50 p-2.5 rounded-xl border border-slate-205">
                      ⏰ {selectedLead.time || '—'}
                    </p>
                  </div>
                </div>

                <div className="space-y-1 pt-3 border-t border-rose-50">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase block">{lang === 'en' ? 'Pickup Details & Stations' : 'تفاصيل ومحطات الاستلام'}</span>
                  <p className="text-xs bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-bold text-slate-700 leading-relaxed block mt-0.5">
                    📍 {selectedLead.customStation}
                  </p>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-rose-50">
                  <button
                    type="button"
                    onClick={() => setSelectedLead(null)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2 px-4 rounded-xl transition"
                  >
                    {lang === 'en' ? 'Close Window' : 'إغلاق التفاصيل'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: TEAM SETTINGS (Visible only to superadmin) */}
        {activeTab === 'settings' && role === 'superadmin' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {lang === 'en' ? 'Administrative Logins Directory' : 'دليل حسابات وموظفي غرف العمليات للتحكم'}
                </h3>
                <p className="text-xs text-slate-500 font-medium font-sans">
                  {lang === 'en' ? 'Create, enable, or revoke dispatcher node access privileges.' : 'إدارة أدوار وصلاحيات وتراخيص دخول المأمورين وغرف التحكم.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setInviteModalOpen(true)}
                className="hover:opacity-90 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer border-0"
                style={{ backgroundColor: '#C0272D' }}
                id="invite-admin-trigger-btn"
              >
                <Plus className="w-4 h-4" />
                <span>{lang === 'en' ? 'Invite Dispatcher Account' : 'دعوة مأمور تشغيل جديد'}</span>
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">
                      <th className="py-4 px-6 font-semibold">{lang === 'en' ? 'User Name' : 'اسم المأمور'}</th>
                      <th className="py-4 px-6 font-semibold">{lang === 'en' ? 'Email Address' : 'البريد الإلكتروني'}</th>
                      <th className="py-4 px-6 font-semibold">{lang === 'en' ? 'Authorized Role' : 'الدور التشغيلي'}</th>
                      <th className="py-4 px-6 font-semibold">{lang === 'en' ? 'Node License State' : 'حالة الحساب'}</th>
                      <th className="py-4 px-6 font-semibold text-center">{lang === 'en' ? 'Access Control Action' : 'إجراءات التحكم والولوج'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                    {adminsLoading ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400 font-medium animate-pulse">
                          {lang === 'en' ? 'Fetching credentials list...' : 'جاري جلب قائمة التراخيص والحسابات من السيرفر الأمني...'}
                        </td>
                      </tr>
                    ) : adminsList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                          {lang === 'en' ? 'No other admin users exist in directory.' : 'لا توجد حسابات مأمورين مسجلة بالدليل.'}
                        </td>
                      </tr>
                    ) : (
                      adminsList.map((adminItem) => (
                        <tr key={adminItem.uid} className="hover:bg-slate-50/55 transition-colors">
                          <td className="py-4 px-6">
                            <div className="font-bold text-slate-950 flex items-center gap-2">
                              {adminItem.name || 'Anonymous'}
                              {adminItem.uid === userData?.uid && (
                                <span className="bg-rose-50 text-rose-700 text-[9px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded border border-rose-250">
                                  {lang === 'en' ? 'YOU' : 'أنت'}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-6 font-mono text-slate-500">{adminItem.email}</td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex items-center gap-1 py-0.5 px-2.5 rounded-lg text-[10px] font-extrabold uppercase ${
                              adminItem.role === 'superadmin' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                              adminItem.role === 'admin' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-slate-50 text-slate-600 border border-slate-200'
                            }`}>
                              {adminItem.role}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase font-mono ${
                              adminItem.active !== false ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-750 border border-rose-200'
                            }`}>
                              ● {adminItem.active !== false ? (lang === 'en' ? 'Active Permission' : 'تحت الخدمة') : (lang === 'en' ? 'Revoked' : 'معطل مؤقتا')}
                            </span>
                          </td>
                          <td className="py-4 px-6 font-bold text-center">
                            {adminItem.uid !== userData?.uid ? (
                              <div className="flex items-center justify-center gap-2">
                                {adminItem.active !== false ? (
                                  <button
                                    onClick={() => handleDeactivate(adminItem.uid)}
                                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 rounded-lg text-[11px] font-bold cursor-pointer transition-all border border-slate-200"
                                  >
                                    {lang === 'en' ? 'Deactivate' : 'إلغاء تفعيل'}
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleReactivate(adminItem.uid)}
                                    className="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-[11px] font-bold cursor-pointer transition-all border border-emerald-250"
                                  >
                                    {lang === 'en' ? 'Reactivate' : 'إعادة تفعيل'}
                                  </button>
                                )}

                                <button
                                  onClick={() => handleDelete(adminItem.uid)}
                                  className="px-2.5 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white rounded-lg text-[11px] font-bold cursor-pointer transition-all border border-rose-250"
                                >
                                  {lang === 'en' ? 'Delete' : 'حذف كلي'}
                                </button>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[10px] font-normal italic">
                                {lang === 'en' ? 'Self managed session' : 'جلسة الإشراف الحالية'}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* 5. FLOATING COMPONENT DIALOG MODALS */}
      {addVehicleOpen && (
        <AddVehicleModal
          onClose={() => setAddVehicleOpen(false)}
          onSave={handleSaveVehicle}
          lang={lang}
        />
      )}

      {createOrderOpen && (
        <CreateOrderModal
          onClose={() => setCreateOrderOpen(false)}
          onSave={handleSaveOrder}
          lang={lang}
        />
      )}

      {/* 6. INVITE ADMIN MODAL DIALOG (SUPERADMIN EXCLUSIVE) */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 max-w-md w-full relative" id="invite-admin-modal">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-tight">
                {lang === 'en' ? 'Invite Command Dispatcher' : 'دعوة مأمور تشغيل لغرفة العمليات'}
              </h3>
              <button 
                onClick={() => {
                  setInviteModalOpen(false);
                  setInviteError(null);
                  setInviteSuccess(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-50 cursor-pointer border-0 bg-transparent"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="space-y-4">
              {inviteError && (
                <div className="bg-rose-50 border-l-4 border-rose-500 text-rose-800 p-3 rounded text-xs font-bold shadow-sm">
                  {inviteError}
                </div>
              )}

              {inviteSuccess && (
                <div className="bg-emerald-50 border-l-4 border-emerald-500 text-emerald-850 p-3.5 rounded text-xs leading-relaxed shadow-sm">
                  <span className="font-extrabold block mb-1">{lang === 'en' ? 'Invite Created Successfully!' : 'تم إنشاء الدعوة بنجاح!'}</span>
                  <span className="font-medium text-slate-700 block text-[11px] max-h-32 overflow-y-auto break-all font-mono bg-white p-2 rounded border border-emerald-200">
                    {inviteSuccess}
                  </span>
                  <span className="font-bold text-[10px] text-slate-500 mt-2 block">
                    {lang === 'en' ? 'Copy the secure password link and send it directly to Salem.' : 'انسخ الرابط الأمني وزوده لسالم لتهيئة كلمة المرور.'}
                  </span>
                </div>
              )}

              {/* Full Name input */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-600 block uppercase tracking-wider">
                  {lang === 'en' ? 'Full Contact Name' : 'اسم الموظف الثلاثي'}
                </label>
                <input
                  type="text"
                  required
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder={lang === 'en' ? 'e.g. Salem Al-Qahtani' : 'مثال: سالم القحطاني'}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs text-slate-850 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/50 font-bold"
                />
              </div>

              {/* Email address */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-600 block uppercase tracking-wider">
                  {lang === 'en' ? 'Email Address' : 'عنوان البريد الإلكتروني للعمل'}
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="salem@qawafil.com"
                  className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs text-slate-850 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/50 font-bold"
                />
              </div>

              {/* Role select */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-600 block uppercase tracking-wider">
                  {lang === 'en' ? 'Authorized Permission Level' : 'مستوى صلاحية مأمور التشغيل'}
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs text-slate-850 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/50 font-bold cursor-pointer"
                >
                  <option value="admin">Admin (Read + Write Access)</option>
                  <option value="viewer">Viewer (Read-Only Access)</option>
                </select>
              </div>

              {/* Submit button using high-contrast brand color `#C0272D` */}
              <button
                type="submit"
                disabled={inviteLoading}
                className="w-full text-white font-bold text-xs rounded-xl py-3 px-4 transition-all duration-200 cursor-pointer shadow-md flex items-center justify-center gap-2 mt-2 hover:opacity-95 border-0"
                style={{ backgroundColor: '#C0272D' }}
              >
                {inviteLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>{lang === 'en' ? 'Provisioning secure authorization...' : 'جاري إنشاء الترخيص وتهيئة الحساب...'}</span>
                  </>
                ) : (
                  <span>{lang === 'en' ? 'Establish Secure Node invite' : 'توليد ترخيص الدخول وإرساله'}</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
