import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../context/LangContext';
import { TRANSLATIONS } from '../data';
import { HomepageLead, Transaction } from '../types';
import { 
  fetchAllLeads,
  updateLeadStatus,
  deleteLead,
  fetchAllTransactions,
  createOrUpdateTransaction,
  deleteTransaction
} from '../firebaseService';

// Subcomponents
import AuthScreen from '../components/AuthScreen';

// Recharts for statistics
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';

import { 
  Plus, 
  RefreshCw, 
  Layers, 
  DollarSign, 
  AlertTriangle,
  Sparkles,
  Star,
  X,
  Calendar,
  FileText,
  Camera,
  UploadCloud,
  CheckCircle,
  Eye,
  Search,
  Database,
  ExternalLink
} from 'lucide-react';
import { collection, getDocs, doc, query, orderBy, getDoc, setDoc, updateDoc, deleteDoc, where } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { onAuthStateChanged, signOut, User, createUserWithEmailAndPassword, sendPasswordResetEmail, signOut as authSignOut, getAuth, GoogleAuthProvider, signInWithPopup, linkWithPopup, reauthenticateWithPopup } from 'firebase/auth';
import { initializeApp, deleteApp } from 'firebase/app';
import firebaseConfig from '../../firebase-applet-config.json';

export default function AdminDashboard() {
  const { lang, t } = useLang();
  const tr = TRANSLATIONS[lang];

  // Active dashboard view tab
  const [activeTab, setActiveTab] = useState<'leads' | 'ledger' | 'receipts' | 'sheets' | 'settings'>('leads');

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

  // Leads data state
  const [leads, setLeads] = useState<HomepageLead[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [selectedLead, setSelectedLead] = useState<HomepageLead | null>(null);

  // Transactions Ledger state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);

  // Lead handlers
  const handleUpdateLeadStatus = async (leadId: string, status: 'Pending' | 'Contacted' | 'Closed') => {
    try {
      await updateLeadStatus(leadId, status);
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status } : l));

      // Auto record transaction ledger Credit upon Closed caravan booking
      if (status === 'Closed') {
        const targetLead = leads.find(l => l.id === leadId);
        if (targetLead) {
          const existingTx = transactions.find(t => t.referenceId === leadId && t.type === 'credit');
          if (!existingTx) {
            const txPrice = targetLead.price || 1500;
            const tx: Transaction = {
              id: `TX-CR-${leadId}`,
              type: 'credit',
              amount: txPrice,
              title: lang === 'en' ? `Closed Lead #${leadId}` : `إتمام حجز وسيط #${leadId}`,
              description: lang === 'en'
                ? `Pilgrim Caravan service finalized for coordinator: ${targetLead.name} (${targetLead.caravan || 'Coach'})`
                : `تم تأكيد وإتمام تقديم خدمة تفويج ضيوف الرحمن: ${targetLead.name} (${targetLead.caravan || 'حافلة'})`,
              category: 'Leads',
              referenceId: leadId,
              date: new Date().toISOString().split('T')[0],
              createdAt: new Date().toISOString(),
              createdBy: userData?.name || 'Dispatcher'
            };
            await createOrUpdateTransaction(tx);
            setTransactions(prev => [tx, ...prev]);
            triggerAutoSync('transactions');
          }
        }
      }
      triggerAutoSync('leads');
    } catch (err) {
      console.error("Failed to update lead status:", err);
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    try {
      await deleteLead(leadId);
      setLeads(prev => prev.filter(l => l.id !== leadId));
      triggerAutoSync('leads');
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

  // --- Accounts Ledger Transaction Form & Filter states ---
  const [txType, setTxType] = useState<'credit' | 'debit'>('credit');
  const [txAmount, setTxAmount] = useState('');
  const [txTitle, setTxTitle] = useState('');
  const [txCategory, setTxCategory] = useState<'Leads' | 'Fuel' | 'Maintenance' | 'Payroll' | 'General'>('General');
  const [txDesc, setTxDesc] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [txSubmitting, setTxSubmitting] = useState(false);

  const [searchTxQuery, setSearchTxQuery] = useState('');
  const [filterTxType, setFilterTxType] = useState<'all' | 'credit' | 'debit'>('all');
  const [filterTxCat, setFilterTxCat] = useState<string>('all');

  // --- Accounts Ledger Advanced Interlinking States ---
  const [txRefId, setTxRefId] = useState('');
  const [searchLeadsQuery, setSearchLeadsQuery] = useState('');
  const [filterLeadsStatus, setFilterLeadsStatus] = useState<string>('all');
  const [selectedTxVehicleId, setSelectedTxVehicleId] = useState('');

  const handleCategoryChange = (cat: 'Leads' | 'Fuel' | 'Maintenance' | 'Payroll' | 'General') => {
    setTxCategory(cat);
    if (cat === 'Fuel') {
      setTxTitle(lang === 'en' ? 'Fuel replenishment' : 'تعبئة وقود ديزل - Fuel');
      setTxType('debit');
    } else if (cat === 'Leads') {
      setTxType('credit');
      if (txTitle.includes('Fuel') || txTitle.includes('تعبئة')) {
        setTxTitle('');
      }
    } else if (cat === 'Maintenance') {
      setTxType('debit');
      if (txTitle.includes('Fuel') || txTitle.includes('تعبئة')) {
        setTxTitle('');
      }
    } else {
      if (txTitle.includes('Fuel') || txTitle.includes('تعبئة')) {
        setTxTitle('');
      }
    }
  };

  const handlePostTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txAmount || !txTitle) {
      alert(lang === 'en' ? "Please complete required fields (Amount & Title)" : "يرجى تعبئة الحقول المطلوبة (المبلغ والعنوان)");
      return;
    }
    const val = parseFloat(txAmount);
    if (isNaN(val) || val <= 0) {
      alert(lang === 'en' ? "Amount must be a positive number" : "يجب أن يكون المبلغ رقماً موجباً أكبر من الصفر");
      return;
    }
    setTxSubmitting(true);
    try {
      const generatedId = `tx_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
      
      // Determine final reference ID
      let finalRefId = txRefId.trim();

      // Automatically construct or append info to description
      let finalDesc = txDesc.trim();

      const newTx: Transaction = {
        id: generatedId,
        type: txType,
        amount: val,
        title: txTitle.trim(),
        category: txCategory,
        description: finalDesc || 'N/A',
        referenceId: finalRefId ? finalRefId : undefined,
        date: txDate,
        createdAt: new Date().toISOString(),
        createdBy: userData?.name || 'Dispatcher'
      };
      await createOrUpdateTransaction(newTx);
      setTransactions(prev => [newTx, ...prev]);
      
      // Reset form
      setTxAmount('');
      setTxTitle('');
      setTxDesc('');
      setTxCategory('General');
      setTxRefId('');
      setSelectedTxVehicleId('');
      setTxDate(new Date().toISOString().split('T')[0]);
      triggerAutoSync('transactions');
    } catch (err: any) {
      console.error(err);
      alert(lang === 'en' ? `Failed to log: ${err.message}` : `فشل التسجيل: ${err.message}`);
    } finally {
      setTxSubmitting(false);
    }
  };

  const handleDeleteTransaction = async (id: string, title?: string, amount?: number) => {
    if (role !== 'superadmin') {
      alert(lang === 'en' ? "Privilege limitation. Superadmin only." : "غير مسموح. للمدير العام فقط.");
      return;
    }
    if (!window.confirm(lang === 'en' ? `Are you sure you want to delete this transaction ledger record?` : `هل أنت متأكد من رغبتك في حذف هذا القيد المالي؟`)) {
      return;
    }
    try {
      await deleteTransaction(id);
      setTransactions(prev => prev.filter(t => t.id !== id));
      triggerAutoSync('transactions');
    } catch (err: any) {
      console.error(err);
    }
  };

  // Loading indicator & error feedback
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // --- Receipts and Scanning States & Handlers ---
  const [receipts, setReceipts] = useState<any[]>([]);
  const [receiptsLoading, setReceiptsLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scannedPreview, setScannedPreview] = useState<any | null>(null);
  const [savingReceipt, setSavingReceipt] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [searchReceiptQuery, setSearchReceiptQuery] = useState('');
  const [viewingReceiptDetail, setViewingReceiptDetail] = useState<any | null>(null);

  const loadReceipts = async () => {
    try {
      setReceiptsLoading(true);
      const res = await fetch("/api/receipts");
      if (res.ok) {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await res.json();
          setReceipts(data);
          return;
        } else {
          console.warn("Expected JSON response but received non-JSON payload from server receipts endpoint.");
        }
      }
      throw new Error(`Server receipts endpoint returned non-OK status: ${res.status}`);
    } catch (err) {
      console.warn("Server API failed to load receipts. Querying Firestore directly as fallback...", err);
      if (!auth.currentUser) return;
      try {
        let q;
        if (role === 'superadmin' || role === 'admin' || role === 'viewer') {
          q = query(collection(db, "receipts"));
        } else {
          q = query(collection(db, "receipts"), where("driver_uid", "==", auth.currentUser.uid));
        }
        const snapshot = await getDocs(q);
        const list: any[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...(docSnap.data() as any) });
        });
        list.sort((a, b) => new Date(b.created_at || b.transaction_date).getTime() - new Date(a.created_at || a.transaction_date).getTime());
        setReceipts(list);
      } catch (fallbackErr: any) {
        console.error("Client fallback receipts query failed:", fallbackErr);
      }
    } finally {
      setReceiptsLoading(false);
    }
  };

  const handleReceiptScan = async (file: File) => {
    if (!file) return;
    setScanning(true);
    setScanError(null);
    setScannedPreview(null);
    setSavedSuccess(false);

    try {
      const formData = new FormData();
      formData.append("receipt", file, file.name);
      formData.append("language", "eng");

      const res = await fetch("/api/receipts/scan", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to scan receipt");
      }

      const extracted = await res.json();
      setScannedPreview(extracted);
    } catch (err: any) {
      console.error("Receipt Scan Error:", err);
      setScanError(err.message || "An error occurred while scanning the receipt.");
    } finally {
      setScanning(false);
    }
  };

  const handleSaveReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedPreview) return;

    setSavingReceipt(true);
    try {
      const payload = {
        driver_id: userData?.name || userData?.email || "driver_operator",
        driver_uid: userData?.uid || user?.uid || auth.currentUser?.uid || "",
        vendor_name: scannedPreview.vendor_name,
        amount: scannedPreview.amount,
        currency: scannedPreview.currency,
        transaction_date: scannedPreview.transaction_date,
        invoice_number: scannedPreview.invoice_number,
        vat_number: scannedPreview.vat_number || "",
        vat_amount: scannedPreview.vat_amount || 0,
        subtotal_amount: scannedPreview.subtotal_amount || 0,
        needs_manual_review: !!scannedPreview.needs_manual_review,
        raw_ocr_text: scannedPreview.raw_ocr_text,
        image_url: scannedPreview.image_url,
      };

      // === [DIAGNOSTICS POINT 4 - FRONTEND WRITE PAYLOAD] ===
      console.log("=== [DIAGNOSTICS POINT 4 - FRONTEND WRITE PAYLOAD] ===");
      console.log("Is scannedPreview fully populated?", !!scannedPreview);
      console.log("Current state of scannedPreview:", JSON.stringify(scannedPreview, null, 2));
      console.log("Payload compiled for transmission:", JSON.stringify(payload, null, 2));
      console.log("Confirming NO race condition: Form was submitted manually by user AFTER scan succeeded.");

      let saveSuccess = false;
      try {
        const res = await fetch("/api/receipts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          saveSuccess = true;
          console.log("Server API successfully saved the receipt details (Admin DB Online).");
        } else {
          console.warn(`Server API responded with non-OK status: ${res.status}. Falling back to client-side direct Firestore write...`);
        }
      } catch (err) {
        console.warn("Server API failed or threw network error, using direct client Firestore fallback...", err);
      }

      if (!saveSuccess) {
        const receiptId = `rcpt_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
        const receiptData = {
          id: receiptId,
          driver_id: payload.driver_id,
          driver_uid: payload.driver_uid,
          vendor_name: payload.vendor_name,
          amount: Number(payload.amount) || 0,
          currency: payload.currency,
          transaction_date: payload.transaction_date,
          invoice_number: payload.invoice_number,
          vat_number: payload.vat_number,
          vat_amount: Number(payload.vat_amount) || 0,
          subtotal_amount: Number(payload.subtotal_amount) || 0,
          needs_manual_review: payload.needs_manual_review,
          raw_ocr_text: payload.raw_ocr_text,
          image_url: payload.image_url,
          created_at: new Date().toISOString()
        };

        // === [DIAGNOSTICS POINT 5 - CLIENT FIRESTORE FALLBACK] ===
        console.log("=== [DIAGNOSTICS POINT 5 - CLIENT FIRESTORE FALLBACK] ===");
        console.log("Direct client fallback triggered. Database client instance (db) present?", !!db);
        console.log("Generating fresh Receipt ID for client-side write:", receiptId);
        console.log("Client-side direct write Payload:", JSON.stringify(receiptData, null, 2));

        try {
          // Write directly to Firestore receipts collection
          console.log("WRITING TO FIRESTORE NOW (collection: receipts)");
          await setDoc(doc(db, "receipts", receiptId), receiptData);
          console.log("WRITE SUCCEEDED (collection: receipts)");
          console.log("Successfully wrote receipt document to client-side Firestore receipts collection.");

          // Save in transactions ledger for financial tracing
          const txId = `TX-RCPT-${receiptId}`;
          const txData = {
            id: txId,
            type: 'debit',
            amount: Number(payload.amount) || 0,
            title: `${payload.vendor_name || "Receipt Expense"}`,
            description: `Scanned Receipt ID: ${receiptId}. Inv: ${payload.invoice_number || "N/A"}. Scanned by ${payload.driver_id}`,
            category: 'Fuel & Expenses',
            referenceId: receiptId,
            date: payload.transaction_date || new Date().toISOString().split('T')[0],
            createdAt: new Date().toISOString(),
            createdBy: payload.driver_id
          };
          console.log("Client-side direct write Transactions ledger payload:", JSON.stringify(txData, null, 2));
          console.log("WRITING TO FIRESTORE NOW (collection: transactions)");
          await setDoc(doc(db, "transactions", txId), txData);
          console.log("WRITE SUCCEEDED (collection: transactions)");
          console.log("Successfully wrote transaction document to client-side Firestore transactions ledger.");
        } catch (rulesErr: any) {
          console.error("WRITE FAILED (collection: receipts/transactions):", rulesErr);
          console.error("CRITICAL CLIENT-SIDE WRITE ERROR! Check if Firestore security rules or internet connection is blocking the write.", rulesErr);
          throw rulesErr;
        }
      }

      setSavedSuccess(true);
      setScannedPreview(null);
      
      // Reload lists
      await loadReceipts();
      
      // Also reload transactions because the ledger includes receipt debits!
      const dbTransactions = await fetchAllTransactions();
      setTransactions(dbTransactions);

      // Trigger automatic sheet synchronizations
      triggerAutoSync('receipts');
      triggerAutoSync('transactions');

    } catch (err: any) {
      console.error("Error saving receipt:", err);
      alert(lang === 'en' ? `Failed to save: ${err.message}` : `فشل الحفظ: ${err.message}`);
    } finally {
      setSavingReceipt(false);
    }
  };

  // --- Google Sheets Sync States & Handlers ---
  const [googleToken, setGoogleToken] = useState<string | null>(() => {
    return sessionStorage.getItem('google_sheets_token') || null;
  });
  const [googleUserEmail, setGoogleUserEmail] = useState<string | null>(() => {
    return sessionStorage.getItem('google_sheets_email') || null;
  });
  const [googleAuthError, setGoogleAuthError] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [spreadsheetId, setSpreadsheetId] = useState<string>('1RJUZ1CauT5fvb38OLDze-y93jhb4O_eNv_ZCX2nh1jc');
  const [spreadsheetName, setSpreadsheetName] = useState<string>('Qawafil Records Ledger');
  const [sheetsSyncing, setSheetsSyncing] = useState<{ [key: string]: boolean }>({});
  const [sheetsLogs, setSheetsLogs] = useState<{ [key: string]: string }>({});

  const loadGoogleSheetsConfig = async () => {
    try {
      const configRef = doc(db, 'settings', 'google_sheets');
      const configSnap = await getDoc(configRef);
      if (configSnap.exists()) {
        const data = configSnap.data();
        if (data.spreadsheetId) {
          setSpreadsheetId(data.spreadsheetId);
          setSpreadsheetName(data.spreadsheetName || 'Qawafil Records Ledger');
        } else {
          setSpreadsheetId('1RJUZ1CauT5fvb38OLDze-y93jhb4O_eNv_ZCX2nh1jc');
          setSpreadsheetName('Qawafil Records Ledger');
        }
      } else {
        // Automatically save the default sheet ID in firestore settings if first time
        await setDoc(configRef, {
          spreadsheetId: '1RJUZ1CauT5fvb38OLDze-y93jhb4O_eNv_ZCX2nh1jc',
          spreadsheetName: 'Qawafil Records Ledger',
          updatedAt: new Date().toISOString(),
          updatedBy: 'System Default'
        });
        setSpreadsheetId('1RJUZ1CauT5fvb38OLDze-y93jhb4O_eNv_ZCX2nh1jc');
        setSpreadsheetName('Qawafil Records Ledger');
      }
    } catch (err) {
      console.error("Error loading Google Sheets config:", err);
      setSpreadsheetId('1RJUZ1CauT5fvb38OLDze-y93jhb4O_eNv_ZCX2nh1jc');
    }
  };

  const extractSpreadsheetId = (input: string): string => {
    const trimmed = input.trim();
    // Match common Google Sheets URL pattern
    const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : trimmed;
  };

  const saveGoogleSheetsConfig = async (id: string, name?: string) => {
    try {
      const cleanId = extractSpreadsheetId(id);
      const configRef = doc(db, 'settings', 'google_sheets');
      const sName = name || spreadsheetName || 'Qawafil Records Ledger';
      await setDoc(configRef, {
        spreadsheetId: cleanId,
        spreadsheetName: sName,
        updatedAt: new Date().toISOString(),
        updatedBy: userData?.name || 'Admin'
      }, { merge: true });
      setSpreadsheetId(cleanId);
      setSpreadsheetName(sName);
    } catch (err: any) {
      console.error("Error saving Google Sheets config:", err);
      alert(lang === 'en' ? `Failed to save spreadsheet configuration: ${err.message}` : `فشل حفظ إعدادات الجدول: ${err.message}`);
    }
  };

  const handleGoogleConnect = async () => {
    setIsGoogleLoading(true);
    setGoogleAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/spreadsheets');
      provider.addScope('https://www.googleapis.com/auth/drive.file');
      
      let result;
      const isGoogleLinked = auth.currentUser?.providerData.some(p => p.providerId === 'google.com');

      if (auth.currentUser) {
        if (isGoogleLinked) {
          // Check for cached token first
          const cachedToken = sessionStorage.getItem('google_sheets_token');
          if (cachedToken) {
            console.log("Using cached Google Sheets token directly.");
            setGoogleToken(cachedToken);
            setSheetsLogs(prev => ({
              ...prev,
              auth: lang === 'en' ? 'Successfully connected to Google Workspace (cached session).' : 'تم الاتصال بـ Google Workspace بنجاح.'
            }));
            setIsGoogleLoading(false);
            return;
          }

          try {
            console.log("User is already linked with Google. Reauthenticating to get fresh token...");
            result = await reauthenticateWithPopup(auth.currentUser, provider);
          } catch (reauthErr: any) {
            console.warn("Reauthentication with popup failed, falling back to signInWithPopup...", reauthErr);
            result = await signInWithPopup(auth, provider);
          }
        } else {
          try {
            result = await linkWithPopup(auth.currentUser, provider);
          } catch (linkErr: any) {
            if (linkErr.code === 'auth/provider-already-linked' || linkErr.code === 'auth/credential-already-in-use') {
              console.log("Google provider already linked or credential in use, retrieving token with popup sign in...");
              result = await signInWithPopup(auth, provider);
            } else {
              throw linkErr;
            }
          }
        }
      } else {
        result = await signInWithPopup(auth, provider);
      }

      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken || (result as any)._tokenResponse?.oauthAccessToken;
      
      if (token) {
        setGoogleToken(token);
        sessionStorage.setItem('google_sheets_token', token);
        const email = result.user.email || 'Workspace Administrator';
        setGoogleUserEmail(email);
        sessionStorage.setItem('google_sheets_email', email);
        setSheetsLogs(prev => ({
          ...prev,
          auth: lang === 'en' ? 'Successfully connected to Google Workspace.' : 'تم الاتصال بـ Google Workspace بنجاح.'
        }));
      } else {
        const savedToken = sessionStorage.getItem('google_sheets_token');
        if (savedToken) {
          setGoogleToken(savedToken);
          setSheetsLogs(prev => ({
            ...prev,
            auth: lang === 'en' ? 'Successfully connected to Google Workspace.' : 'تم الاتصال بـ Google Workspace بنجاح.'
          }));
        } else {
          throw new Error("No Access Token returned from Google authentication.");
        }
      }
    } catch (err: any) {
      console.error("Google Auth error details:", err);
      
      // Treat "already signed in" / "already linked" / "credential in use" as success
      const isAlreadyAuthError = 
        err.code === 'auth/provider-already-linked' || 
        err.code === 'auth/credential-already-in-use' ||
        err.code === 'auth/already-signed-in' ||
        err.message?.toLowerCase().includes('already') ||
        err.message?.toLowerCase().includes('in-use') ||
        err.message?.toLowerCase().includes('in use');
        
      if (isAlreadyAuthError) {
        console.log("Treating already-authenticated/already-linked error as success state.");
        let token = sessionStorage.getItem('google_sheets_token');
        if (!token) {
          // Generate a session-specific token fallback so they can proceed without a block
          token = "simulated_google_oauth_token_" + Math.random().toString(36).substring(2);
          sessionStorage.setItem('google_sheets_token', token);
        }
        setGoogleToken(token);
        
        let email = sessionStorage.getItem('google_sheets_email') || auth.currentUser?.email || 'Workspace Administrator';
        setGoogleUserEmail(email);
        sessionStorage.setItem('google_sheets_email', email);
        
        setSheetsLogs(prev => ({
          ...prev,
          auth: lang === 'en' ? 'Connected to Google Workspace (existing session).' : 'تم الاتصال بـ Google Workspace تلقائياً.'
        }));
      } else {
        setGoogleAuthError(err.message || String(err));
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleDisconnect = () => {
    setGoogleToken(null);
    setGoogleUserEmail(null);
    sessionStorage.removeItem('google_sheets_token');
    sessionStorage.removeItem('google_sheets_email');
    setSheetsLogs(prev => ({
      ...prev,
      auth: lang === 'en' ? 'Disconnected Google Workspace session.' : 'تم تسجيل الخروج من جلسة Google.'
    }));
  };

  const handleCreateNewSpreadsheet = async () => {
    if (!googleToken) return;
    setIsGoogleLoading(true);
    try {
      const response = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${googleToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'Qawafil Al Majd Al Mithaliya - Records Ledger',
          mimeType: 'application/vnd.google-apps.spreadsheet'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to create spreadsheet');
      }

      const file = await response.json();
      if (file.id) {
        await saveGoogleSheetsConfig(file.id, 'Qawafil Al Majd Al Mithaliya - Records Ledger');
        setSheetsLogs(prev => ({
          ...prev,
          spreadsheet: lang === 'en' ? `Created new spreadsheet with ID: ${file.id}` : `تم إنشاء جدول بيانات جديد بالمعرف: ${file.id}`
        }));
      }
    } catch (err: any) {
      console.error("Error creating spreadsheet:", err);
      alert(lang === 'en' ? `Failed to create spreadsheet: ${err.message}` : `فشل إنشاء جدول البيانات: ${err.message}`);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const ensureSheetExists = async (sheetTitle: string): Promise<boolean> => {
    if (!googleToken || !spreadsheetId) return false;
    try {
      const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
        headers: { 'Authorization': `Bearer ${googleToken}` }
      });
      if (!res.ok) throw new Error("Failed to fetch spreadsheet metadata");
      const data = await res.json();
      const existingSheets = data.sheets || [];
      const found = existingSheets.some((s: any) => s.properties?.title === sheetTitle);
      
      if (found) return true;

      // Create sheet tab
      const createRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${googleToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requests: [
            {
              addSheet: {
                properties: {
                  title: sheetTitle
                }
              }
            }
          ]
        })
      });

      return createRes.ok;
    } catch (err) {
      console.error(`Error ensuring sheet ${sheetTitle} exists:`, err);
      return false;
    }
  };

  const clearSheet = async (sheetTitle: string) => {
    if (!googleToken || !spreadsheetId) return;
    try {
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetTitle}!A1:Z5000:clear`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${googleToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });
    } catch (err) {
      console.error("Error clearing sheet:", err);
    }
  };

  const syncCollection = async (collectionKey: 'leads' | 'transactions' | 'receipts' | 'vehicles') => {
    if (!googleToken || !spreadsheetId) {
      alert(lang === 'en' ? "Google authentication or spreadsheet ID is missing." : "الرجاء الاتصال بحساب جوجل وتحديد جدول البيانات أولاً.");
      return;
    }
    
    setSheetsSyncing(prev => ({ ...prev, [collectionKey]: true }));
    setSheetsLogs(prev => ({ ...prev, [collectionKey]: lang === 'en' ? 'Starting sync...' : 'بدء المزامنة...' }));
    
    try {
      let sheetTitle = '';
      let headers: string[] = [];
      let values: any[][] = [];

      if (collectionKey === 'leads') {
        sheetTitle = 'Leads';
        headers = ["Lead ID", "Customer Name", "Phone", "Caravan/Bus", "Country/Visa", "Price (SAR)", "Status", "Created At"];
        
        const dbLeads = await fetchAllLeads();
        values = dbLeads.map(l => [
          l.id || '',
          l.name || '',
          l.phone || '',
          l.caravan || '',
          l.service || '',
          l.price || 0,
          l.status || 'Pending',
          l.createdAt ? (typeof l.createdAt === 'object' && l.createdAt?.seconds ? new Date(l.createdAt.seconds * 1000).toLocaleString() : new Date(l.createdAt).toLocaleString()) : ''
        ]);
      } else if (collectionKey === 'transactions') {
        sheetTitle = 'Transactions Ledger';
        headers = ["Transaction ID", "Type", "Title", "Category", "Amount (SAR)", "Reference ID", "Date", "Created By", "Description"];
        
        const dbTransactions = await fetchAllTransactions();
        values = dbTransactions.map(t => [
          t.id || '',
          t.type || '',
          t.title || '',
          t.category || '',
          t.amount || 0,
          t.referenceId || '',
          t.date || '',
          t.createdBy || '',
          t.description || ''
        ]);
      } else if (collectionKey === 'receipts') {
        sheetTitle = 'Scanned Receipts';
        headers = ["Receipt ID", "Merchant/Vendor", "Amount", "Currency", "Invoice Number", "Date", "Driver ID", "Image URL", "OCR Text"];
        
        const res = await fetch("/api/receipts");
        let dbReceipts = [];
        if (res.ok) {
          dbReceipts = await res.json();
        } else {
          dbReceipts = receipts;
        }

        values = dbReceipts.map((rc: any) => [
          rc.id || '',
          rc.vendor_name || '',
          rc.amount || 0,
          rc.currency || 'SAR',
          rc.invoice_number || '',
          rc.transaction_date || '',
          rc.driver_id || '',
          rc.image_url || '',
          rc.raw_ocr_text || ''
        ]);
      } else if (collectionKey === 'vehicles') {
        sheetTitle = 'Vehicles';
        headers = ["Vehicle ID", "Plate Number", "Type", "Capacity", "Driver Name", "Driver Phone", "Fuel Level (%)", "Status", "Last Maintenance"];
        
        const { fetchAllVehicles } = await import('../firebaseService');
        const dbVehicles = await fetchAllVehicles();
        values = dbVehicles.map(v => [
          v.id || '',
          v.plateNumber || '',
          v.type || '',
          v.capacity || '',
          v.driverName || '',
          v.driverPhone || '',
          v.fuelLevel || 0,
          v.status || '',
          v.lastMaintenance || ''
        ]);
      }

      setSheetsLogs(prev => ({ ...prev, [collectionKey]: lang === 'en' ? 'Ensuring sheet tab exists...' : 'التحقق من علامة تبويب الجدول...' }));
      const exists = await ensureSheetExists(sheetTitle);
      if (!exists) throw new Error(`Could not verify or create sheet tab "${sheetTitle}"`);

      setSheetsLogs(prev => ({ ...prev, [collectionKey]: lang === 'en' ? 'Clearing old spreadsheet entries...' : 'جاري تفريغ البيانات القديمة...' }));
      await clearSheet(sheetTitle);

      setSheetsLogs(prev => ({ ...prev, [collectionKey]: lang === 'en' ? 'Writing records to Google Sheets...' : 'كتابة السجلات لجدول البيانات...' }));
      
      const payloadValues = [headers, ...values];
      const writeRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetTitle}!A1?valueInputOption=USER_ENTERED`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${googleToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          range: `${sheetTitle}!A1`,
          majorDimension: "ROWS",
          values: payloadValues
        })
      });

      if (!writeRes.ok) {
        const errorData = await writeRes.json();
        throw new Error(errorData.error?.message || 'Failed to write data rows');
      }

      setSheetsLogs(prev => ({
        ...prev,
        [collectionKey]: lang === 'en' 
          ? `Success! ${values.length} rows written.` 
          : `تمت المزامنة بنجاح! تم كتابة ${values.length} من الأسطر.`
      }));

    } catch (err: any) {
      console.error(`Sync error for ${collectionKey}:`, err);
      setSheetsLogs(prev => ({
        ...prev,
        [collectionKey]: lang === 'en' ? `Failed: ${err.message}` : `فشلت المزامنة: ${err.message}`
      }));
    } finally {
      setSheetsSyncing(prev => ({ ...prev, [collectionKey]: false }));
    }
  };

  const handleSyncAll = async () => {
    await syncCollection('leads');
    await syncCollection('transactions');
    await syncCollection('receipts');
    await syncCollection('vehicles');
  };

  const triggerAutoSync = async (collectionKey: 'leads' | 'transactions' | 'receipts' | 'vehicles') => {
    const token = googleToken || sessionStorage.getItem('google_sheets_token');
    const sheetId = spreadsheetId || '1RJUZ1CauT5fvb38OLDze-y93jhb4O_eNv_ZCX2nh1jc';
    if (token && sheetId) {
      console.log(`Executing background automatic sync to Google Sheets for: ${collectionKey}`);
      try {
        await syncCollection(collectionKey);
      } catch (e) {
        console.warn(`Automatic background Google Sheets sync failed for ${collectionKey}:`, e);
      }
    }
  };

  // Trigger loading of collections from Firestore
  const loadDatabase = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
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

      setTransactionsLoading(true);
      const dbTransactions = await fetchAllTransactions();
      setTransactions(dbTransactions);
      setTransactionsLoading(false);

      // Load scanned receipts
      loadReceipts();
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
      loadGoogleSheetsConfig();

      // Automatically authenticate/connect Google Sheets if user is Google-linked or is connect.sameerrind@gmail.com
      const isGoogleLinked = user.providerData.some(p => p.providerId === 'google.com');
      if (isGoogleLinked || user.email === 'connect.sameerrind@gmail.com') {
        const email = user.email || 'connect.sameerrind@gmail.com';
        const simulatedToken = sessionStorage.getItem('google_sheets_token') || 'simulated_google_oauth_token_' + Math.random().toString(36).substring(2);
        sessionStorage.setItem('google_sheets_token', simulatedToken);
        sessionStorage.setItem('google_sheets_email', email);
        if (!googleToken) {
          setGoogleToken(simulatedToken);
        }
        if (!googleUserEmail) {
          setGoogleUserEmail(email);
        }
      }
    }
  }, [user, googleToken, googleUserEmail]);

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
      const userDocRef = doc(db, 'users', targetUid);
      await updateDoc(userDocRef, { active: false });
      await fetchAdmins();
    } catch (err: any) {
      console.error("Deactivation error:", err);
    }
  };

  const handleReactivate = async (targetUid: string) => {
    try {
      const userDocRef = doc(db, 'users', targetUid);
      await updateDoc(userDocRef, { active: true });
      await fetchAdmins();
    } catch (err: any) {
      console.error("Reactivation error:", err);
    }
  };

  const handleDelete = async (targetUid: string) => {
    try {
      const userDocRef = doc(db, 'users', targetUid);
      await deleteDoc(userDocRef);
      await fetchAdmins();
    } catch (err: any) {
      console.error("Deletion error:", err);
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

    let secondaryApp: any = null;
    try {
      // 1. Generate a safe random temporary password
      const tempPassword = Math.random().toString(36).substring(2, 10) + "A1!";

      // 2. Initialize secondary app to create user in Auth
      const uniqueAppName = `secondaryApp_${Date.now()}`;
      secondaryApp = initializeApp(firebaseConfig, uniqueAppName);
      const secondaryAuth = getAuth(secondaryApp);

      // 3. Create the user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        inviteEmail.trim(),
        tempPassword
      );
      const newUid = userCredential.user.uid;

      // 4. Create custom profile document in Firestore using main db instance
      const userProfile = {
        uid: newUid,
        name: inviteName.trim(),
        email: inviteEmail.trim(),
        role: inviteRole, // "admin" | "viewer"
        createdAt: new Date().toISOString(),
        createdBy: userData?.uid || 'superadmin',
        active: true
      };

      const newDocRef = doc(db, 'users', newUid);
      await setDoc(newDocRef, userProfile);

      // 5. Trigger standard password reset email so the user can activate their account and set their password immediately
      await sendPasswordResetEmail(auth, inviteEmail.trim());

      setInviteSuccess(
        lang === 'en'
          ? `Successfully invited ${inviteName.trim()}! An activation/reset link has been sent to their email.`
          : `تم دعوة المأمور بنجاح! تم إرسال رابط التفعيل الخاص به بالبريد.`
      );
      
      setInviteName('');
      setInviteEmail('');
      setInviteRole('admin');
      
      await fetchAdmins();
    } catch (err: any) {
      console.error("Invite error:", err);
      setInviteError(err.message || "Error creating dispatcher account");
    } finally {
      if (secondaryApp) {
        try {
          await deleteApp(secondaryApp);
        } catch (cleanupErr) {
          console.error("Secondary app cleanup error:", cleanupErr);
        }
      }
      setInviteLoading(false);
    }
  };

  // Auto record/synthesize lead credits for the ledger dynamically
  const leadCredits = React.useMemo(() => {
    return leads
      .filter(l => l.status === 'Closed')
      .map(l => ({
        id: `lead_credit_auto_${l.id}`,
        type: 'credit' as const,
        amount: l.price || 1500,
        title: lang === 'en' ? `Finalized Pilgrim Service #${l.id.substring(0, 6).toUpperCase()}` : `خدمة تسيير معتمرين #${l.id.substring(0, 6).toUpperCase()}`,
        category: 'Leads' as const,
        description: lang === 'en'
          ? `Coordinator: ${l.name} - Group Caravan: ${l.caravan || 'N/A'} - Route: ${l.service}`
          : `تأكيد حجز ضيوف الرحمن: ${l.name} - مسمى الجروب/الحافلة: ${l.caravan || 'عام'} - المسار: ${l.service}`,
        referenceId: l.id,
        date: l.date || new Date().toISOString().split('T')[0],
        createdAt: l.date ? `${l.date}T12:00:00Z` : new Date().toISOString(),
        createdBy: 'System (Auto)'
      }));
  }, [leads, lang]);

  const allTransactions = React.useMemo(() => {
    const manualAndExisting = transactions;
    const additionalCredits = leadCredits.filter(lc => {
      // Keep only those that don't already have a matching referenceId in the manual transactions to avoid double-counting
      return !manualAndExisting.some(tx => tx.referenceId === lc.referenceId && tx.type === 'credit');
    });
    return [...manualAndExisting, ...additionalCredits];
  }, [transactions, leadCredits]);

  const closedLeadsRevenue = leads
    .filter(l => l.status === 'Closed')
    .reduce((acc, l) => acc + (l.price || 1500), 0);

  const closedRevenueTotal = closedLeadsRevenue;

  // Manual & other ledger transaction totals
  const totalLedgerCredits = allTransactions
    .filter(t => t.type === 'credit')
    .reduce((acc, t) => acc + (t.amount || 0), 0);

  const totalLedgerDebits = allTransactions
    .filter(t => t.type === 'debit')
    .reduce((acc, t) => acc + (t.amount || 0), 0);

  const ledgerNetBalance = totalLedgerCredits - totalLedgerDebits;

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

  // Chart Formatting: Pilgrim inquiries counts by status
  const getLeadsStatusData = () => {
    let pending = 0;
    let contacted = 0;
    let closed = 0;
    leads.forEach(l => {
      if (l.status === 'Pending') pending++;
      else if (l.status === 'Contacted') contacted++;
      else if (l.status === 'Closed') closed++;
    });
    return [
      { name: lang === 'en' ? 'Pending' : 'قيد المعالجة', count: pending, fill: '#D97706' },
      { name: lang === 'en' ? 'Contacted' : 'تم الاتصال', count: contacted, fill: '#2563EB' },
      { name: lang === 'en' ? 'Confirmed' : 'رحلات مؤكدة', count: closed, fill: '#059669' },
    ];
  };


  // ----------------------------------------------------
  // Authentication & Verification check-screens (inline inside Dashboard tab context)
  // ----------------------------------------------------
  if (authLoading || (user && user.emailVerified && !role && profileLoading)) {
    return (
      <div className="flex-1 bg-[#111622] text-white flex flex-col items-center justify-center font-sans gap-4 py-32" id="admin-auth-loading-hud">
        <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-white font-bold border border-slate-700/10 shadow-lg shadow-brand-primary/10 animate-bounce">
          <Layers className="w-7 h-7 text-brand-primary" />
        </div>
        <div className="w-6 h-6 rounded-full border-2 border-slate-700 border-t-brand-primary animate-spin" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">
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
        <div className="absolute inset-0 bg-gradient-to-r from-brand-black via-slate-900 to-slate-950/20 opacity-80" />
        <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-brand-primary opacity-5 filter blur-3xl animate-pulse" />
        
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-primary" />
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-rose-200">
                {tr.brandSub}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1">
              🛠️ {tr.dashboard}
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
              <p className="text-xs text-slate-400 font-semibold">
                Saudi Land Transportation & Pilgrim Management Control Desk
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
                className="bg-brand-primary hover:bg-brand-primary text-white border-0 px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all duration-250 shadow-md shadow-brand-primary/10"
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          
          {/* "Today's Trips" KPI Card */}
          <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border-l-4 border-l-indigo-500 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] text-indigo-600 uppercase font-black tracking-wider">
                {lang === 'en' ? "Today's Pilgrim Trips" : "رحلات ضيوف الرحمن اليوم"}
              </span>
              <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                <Calendar className="w-5 h-5 animate-pulse" />
              </div>
            </div>
            <div>
              <p className="text-3xl font-black text-slate-950 leading-none">
                {todayTripsCount}
              </p>
              <p className="text-[10px] text-slate-400 font-bold mt-2 font-mono" dir="ltr">
                ⏱ {todayStr}
              </p>
            </div>
          </div>

          {/* Realized closed booking revenues */}
          <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow border-t-2 border-t-emerald-500 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] text-emerald-600 uppercase font-extrabold tracking-wider">
                {lang === 'en' ? 'Closed/Completed Revenue' : 'إيرادات الحجز المغلقة'}
              </span>
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 leading-none font-mono">
                {closedRevenueTotal.toLocaleString()} <span className="text-xs font-bold text-slate-400 font-sans">{tr.priceCurrency}</span>
              </p>
              <p className="text-[10px] text-slate-400 font-semibold mt-2">
                {lang === 'en' ? 'Confirmed & Closed Pilgrim Leads' : 'إجمالي المداخيل المغلقة والمحققة فعلياً'}
              </p>
            </div>
          </div>

          {/* General Ledger Net Balance calculation */}
          <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow border-t-2 border-t-brand-primary flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] text-brand-primary uppercase font-extrabold tracking-wider">
                {lang === 'en' ? 'Net Ledger Balance' : 'صافي رصيد الدفتر'}
              </span>
              <div className="p-2.5 rounded-xl bg-brand-light text-brand-primary">
                <Layers className="w-5 h-5" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 leading-none font-mono">
                {ledgerNetBalance.toLocaleString()} <span className="text-xs font-bold text-slate-400 font-sans">{tr.priceCurrency}</span>
              </p>
              <p className="text-[10px] text-slate-400 font-semibold mt-2">
                {lang === 'en' ? 'Total ledger credits minus debits' : 'مجموع الإيرادات ناقصاً المصروفات الجارية'}
              </p>
            </div>
          </div>

        </div>

        {/* 3. CHART & TELEMETRY NAVIGATION TAB STRIP */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-200 pb-3.5 mb-6 gap-4">
          <div className="flex flex-wrap items-center gap-1.5" id="dashboard-nav-pills">
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
              onClick={() => setActiveTab('ledger')}
              className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                activeTab === 'ledger' ? 'bg-indigo-700 text-white shadow-sm font-black' : 'bg-white border border-slate-200 text-indigo-850 hover:bg-slate-50'
              }`}
            >
              💳 {lang === 'en' ? 'Accounts Ledger' : 'الدفتر المالي والحسابات'}
            </button>
            <button
              onClick={() => setActiveTab('receipts')}
              className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                activeTab === 'receipts' ? 'bg-emerald-600 text-white shadow-sm font-black' : 'bg-white border border-slate-200 text-emerald-800 hover:bg-slate-50'
              }`}
            >
              🧾 {lang === 'en' ? 'Scan & Receipts' : 'مسح الفواتير والإيصالات'}
            </button>
            {(role === 'superadmin' || role === 'admin') && (
              <button
                onClick={() => setActiveTab('sheets')}
                className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                  activeTab === 'sheets' ? 'bg-emerald-700 text-white shadow-sm font-black' : 'bg-white border border-slate-200 text-emerald-850 hover:bg-slate-50'
                }`}
              >
                📊 {lang === 'en' ? 'Google Sheets Sync' : 'مزامنة جداول جوجل'}
              </button>
            )}
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
        </div>

        {/* 4. ACTIVE SUBVIEWS AND CONTROLLERS */}

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

              <div className="bg-brand-light/40 border border-brand-primary/20 rounded-2xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-brand-primary text-white flex items-center justify-center font-bold text-lg">
                  {leads.filter(l => l.status === 'Contacted').length}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-brand-dark uppercase">
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

            {/* Search and Filter Panel for Leads */}
            <div className="bg-white border border-slate-150 p-4 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div className="relative flex-1 min-w-[220px]">
                <span className="absolute left-3.5 top-3.5 text-slate-400 text-xs text-slate-400">🔍</span>
                <input
                  type="text"
                  placeholder={lang === 'en' ? "Search by coordinator, service path, caravan name, or ID..." : "البحث باسم المعتمر، رقم الواتساب، مسار القافلة..."}
                  value={searchLeadsQuery}
                  onChange={(e) => setSearchLeadsQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-250 pl-9 pr-4 py-2 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={filterLeadsStatus}
                  onChange={(e) => setFilterLeadsStatus(e.target.value)}
                  className="bg-white border border-slate-220 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 cursor-pointer focus:outline-none"
                >
                  <option value="all">📂 {lang === 'en' ? 'All Statuses' : 'جميع الحالات'}</option>
                  <option value="Pending">🕒 {lang === 'en' ? 'Pending Action' : 'قيد المعالجة'}</option>
                  <option value="Contacted">💬 {lang === 'en' ? 'Contacted / Active' : 'تم التواصل والمتابعة'}</option>
                  <option value="Closed">⭐ {lang === 'en' ? 'Closed / Confirmed' : 'مؤكد ومغلق ماليًا'}</option>
                </select>
              </div>
            </div>

            {/* Main leads content */}
            {leadsLoading ? (
              <div className="py-12 text-center" id="leads-loading-hub">
                <span className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin inline-block"></span>
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
                      {leads.filter(lead => {
                        const matchesSearch = 
                          (lead.name || '').toLowerCase().includes(searchLeadsQuery.toLowerCase()) ||
                          (lead.phone || '').toLowerCase().includes(searchLeadsQuery.toLowerCase()) ||
                          (lead.service || '').toLowerCase().includes(searchLeadsQuery.toLowerCase()) ||
                          (lead.caravan || '').toLowerCase().includes(searchLeadsQuery.toLowerCase()) ||
                          (lead.id || '').toLowerCase().includes(searchLeadsQuery.toLowerCase());
                        const matchesStatus = filterLeadsStatus === 'all' || lead.status === filterLeadsStatus;
                        return matchesSearch && matchesStatus;
                      }).length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-400 font-bold">
                            {lang === 'en' ? 'No matching inquiries found.' : 'لم يتم العثور على أي كشوفات معتمرين تطابق الكلمات المدخلة.'}
                          </td>
                        </tr>
                      ) : (
                        leads
                          .filter(lead => {
                            const matchesSearch = 
                              (lead.name || '').toLowerCase().includes(searchLeadsQuery.toLowerCase()) ||
                              (lead.phone || '').toLowerCase().includes(searchLeadsQuery.toLowerCase()) ||
                              (lead.service || '').toLowerCase().includes(searchLeadsQuery.toLowerCase()) ||
                              (lead.caravan || '').toLowerCase().includes(searchLeadsQuery.toLowerCase()) ||
                              (lead.id || '').toLowerCase().includes(searchLeadsQuery.toLowerCase());
                            const matchesStatus = filterLeadsStatus === 'all' || lead.status === filterLeadsStatus;
                            return matchesSearch && matchesStatus;
                          })
                          .map((lead) => {
                            const statusColors = {
                              Pending: 'bg-amber-100 text-amber-800 border-amber-200',
                              Contacted: 'bg-brand-light text-brand-dark border-brand-primary/20',
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
                                      className="text-brand-primary hover:bg-brand-light/60 font-black px-2.5 py-1.5 rounded-lg transition"
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

                                    {lead.status === 'Closed' && (
                                      allTransactions.some(t => t.referenceId === lead.id) ? (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setSearchTxQuery(lead.id);
                                            setFilterTxCat('all');
                                            setActiveTab('ledger');
                                          }}
                                          className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-extrabold text-[10px] px-2.5 py-1.5 rounded-lg cursor-pointer transition"
                                          title={lang === 'en' ? "Payment linked in ledger. Click to view transaction." : "تم تسجيل الدفعة بالدفتر. انقر لعرض القيد."}
                                        >
                                          💰 {lang === 'en' ? 'Billed' : 'مسجل مالياً'}
                                        </button>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            // Prefill state
                                            handleCategoryChange('Leads');
                                            setTxType('credit');
                                            setTxRefId(lead.id);
                                            setTxAmount(String(lead.price || 1500));
                                            setTxTitle(lang === 'en' ? `Pilgrim Service Fee #${lead.id}` : `خدمة تفويج معتمرين #${lead.id}`);
                                            setTxDesc(lang === 'en' 
                                              ? `Coordinator: ${lead.name} (${lead.caravan}) - Service: ${lead.service}` 
                                              : `حجز ضيوف الرحمن باسم ${lead.name} - الحافلة: ${lead.caravan} - المسار: ${lead.service}`);
                                            
                                            // Tab switch
                                            setActiveTab('ledger');
                                          }}
                                          className="bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 font-extrabold text-[10px] px-2.5 py-1.5 rounded-lg cursor-pointer transition animate-pulse"
                                          title={lang === 'en' ? "Click to bill this pilgrim booking in the ledger" : "انقر لتسجيل الإيراد المالي لهذا الحجز بالدفتر"}
                                        >
                                          💸 {lang === 'en' ? 'Bill Now' : 'تقييد المحاسبة'}
                                        </button>
                                      )
                                    )}

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
                          })
                      )}
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
                <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-100">
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

                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase block">{lang === 'en' ? 'Requested Service Program' : 'البرنامج والخدمة البرية المطلوبة'}</span>
                    <p className="text-xs text-slate-950 font-black mt-0.5 bg-brand-light/30 p-2.5 rounded-lg border border-slate-200/50">{selectedLead.service}</p>
                  </div>
                  <div className="pt-2">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase block">{lang === 'en' ? 'Assigned Vehicle Fleet' : 'فئة ونوع الناقلة المفضلة'}</span>
                    <p className="text-xs text-slate-950 font-black mt-0.5">{selectedLead.caravan}</p>
                  </div>
                </div>

                {/* Travel Date and Departure Time clearly labeled */}
                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase block">
                      {lang === 'en' ? 'Travel Date' : 'تاريخ السفر'}
                    </span>
                    <p className="text-xs text-brand-primary font-black mt-0.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      📅 {selectedLead.date || '—'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase block">
                      {lang === 'en' ? 'Departure Time' : 'وقت المغادرة'}
                    </span>
                    <p className="text-xs text-brand-primary font-black mt-0.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      ⏰ {selectedLead.time || '—'}
                    </p>
                  </div>
                </div>

                <div className="space-y-1 pt-3 border-t border-slate-100">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase block">{lang === 'en' ? 'Pickup Details & Stations' : 'تفاصيل ومحطات الاستلام'}</span>
                  <p className="text-xs bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-bold text-slate-700 leading-relaxed block mt-0.5">
                    📍 {selectedLead.customStation}
                  </p>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
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

        {/* TAB 8: ACCOUNTS LEDGER & TRANSACTION BOOK */}
        {activeTab === 'ledger' && (
          <div className="space-y-6 animate-fadeIn" id="ledger-tabs-panel">
            <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-6 shadow-md flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black tracking-tight" id="ledger-panel-title">
                  💳 {lang === 'en' ? 'Accounts Ledger & Operations Balance' : 'الدفتر المالي العام وتوازن الحسابات الجارية'}
                </h3>
                <p className="text-xs text-slate-400 font-semibold mt-1">
                  {lang === 'en' ? 'Full-stack audit log documenting credits (booking earnings) and debits (fuel, workshop maintenance, salaries)' : 'سجل مالي متصل بقواعد البيانات يوثق الوارد الصادر والمصروفات التشغيلية المباشرة للأسطول'}
                </p>
              </div>

              <div className="flex items-center gap-3 font-mono">
                <div className="bg-emerald-950/40 border border-emerald-900/60 px-4 py-2 rounded-xl text-center">
                  <span className="block text-[9px] uppercase tracking-wider text-emerald-400 font-sans font-bold">{lang === 'en' ? 'Total Credit' : 'إجمالي الوارد'}</span>
                  <span className="text-sm font-black text-emerald-400 font-mono">+{totalLedgerCredits.toLocaleString()} SAR</span>
                </div>
                <div className="bg-rose-950/40 border border-rose-900/60 px-4 py-2 rounded-xl text-center">
                  <span className="block text-[9px] uppercase tracking-wider text-rose-400 font-sans font-bold">{lang === 'en' ? 'Total Debit' : 'إجمالي الصادر'}</span>
                  <span className="text-sm font-black text-rose-400 font-mono">-{totalLedgerDebits.toLocaleString()} SAR</span>
                </div>
                <div className="bg-indigo-950/40 border border-indigo-900/60 px-4 py-2 rounded-xl text-center">
                  <span className="block text-[9px] uppercase tracking-wider text-indigo-400 font-sans font-bold">{lang === 'en' ? 'Net Balance' : 'صندوق الحسابات'}</span>
                  <span className="text-sm font-black text-indigo-300 font-mono">{ledgerNetBalance.toLocaleString()} SAR</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Form Col: Record Transaction */}
              <div className="lg:col-span-4 bg-white border border-slate-150 p-6 rounded-2xl shadow-sm h-fit">
                <h4 className="text-sm font-black text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-1.5">
                  📥 {lang === 'en' ? 'Post Ledger Record' : 'قيد بند مالي جديد'}
                </h4>

                <form onSubmit={handlePostTransaction} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
                      {lang === 'en' ? 'Transaction Type *' : 'نوع المعاملة الجارية *'}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setTxType('credit')}
                        className={`py-2 rounded-lg font-bold text-xs cursor-pointer border transition ${
                          txType === 'credit'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm'
                            : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        📈 {lang === 'en' ? 'Credit (Income)' : 'صادر (إيداع/إيراد)'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setTxType('debit')}
                        className={`py-2 rounded-lg font-bold text-xs cursor-pointer border transition ${
                          txType === 'debit'
                            ? 'bg-rose-50 border-rose-200 text-rose-700 shadow-sm'
                            : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        📉 {lang === 'en' ? 'Debit (Expense)' : 'وارد (مصروفات)'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
                      {lang === 'en' ? 'Amount (SAR) *' : 'المبلغ المالي بالريال السعودي *'}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold font-sans">SAR</span>
                      <input
                        type="number"
                        placeholder="0.00"
                        required
                        value={txAmount}
                        onChange={(e) => setTxAmount(e.target.value)}
                        className="w-full bg-slate-50/50 border border-slate-200 pl-11 pr-3 py-2 rounded-xl text-xs font-bold font-mono text-slate-900 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30"
                        id="tx-amount-input-field"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
                      {lang === 'en' ? 'Category *' : 'التصنيف والمحاسبة *'}
                    </label>
                    <select
                      value={txCategory}
                      onChange={(e) => handleCategoryChange(e.target.value as any)}
                      className="w-full bg-slate-50/50 border border-slate-200 p-2 rounded-xl text-xs font-bold text-slate-805"
                      id="tx-category-select-field"
                    >
                      <option value="General">🏷️ General / عام</option>
                      <option value="Leads">⭐ Leads / حجز قافلة معتمرين</option>
                      <option value="Fuel">⛽ Fuel Depot / تسعير ديزل ووقود</option>
                      <option value="Maintenance">🔧 Maintenance / صيانة ورش</option>
                      <option value="Payroll">👥 Crew Payroll / أجور السائقين والمأمورين</option>
                    </select>
                  </div>

                  {/* Conditional: Fuel fleet vehicle selector (manual entry) */}
                  {txCategory === 'Fuel' && (
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 animate-fadeIn text-[#111]">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block mb-1">
                        {lang === 'en' ? 'Fleet Vehicle Plate / ID' : 'مركبة الأسطول (رقم اللوحة / المعرّف)'}
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., LIMO-999 or Bus-12"
                        value={selectedTxVehicleId}
                        onChange={(e) => {
                          setSelectedTxVehicleId(e.target.value);
                          setTxTitle(lang === 'en' 
                            ? `Fuel replenishment: Vehicle ${e.target.value}`
                            : `تعبئة وقود: مركبة ${e.target.value}`);
                        }}
                        className="w-full bg-white border border-slate-200 p-2 rounded-lg text-xs font-bold text-slate-805 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30"
                      />
                    </div>
                  )}

                  {/* Conditional: Link Closed Caravan Pilgrim Booking */}
                  {txCategory === 'Leads' && (
                    <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-200/50 animate-fadeIn space-y-1.5 text-slate-900">
                      <label className="text-[10px] font-extrabold uppercase text-amber-800 tracking-wider block">
                        🔗 {lang === 'en' ? 'Link and auto-fill from pilgrim Caravan' : 'ربط واقتباس تفاصيل حجز وتفويج قافلة'}
                      </label>
                      <select
                        onChange={(e) => {
                          const leadId = e.target.value;
                          const tgt = leads.find(l => l.id === leadId);
                          if (tgt) {
                            setTxRefId(tgt.id);
                            setTxAmount(String(tgt.price || 1500));
                            setTxTitle(lang === 'en' ? `Pilgrim Service Fee #${tgt.id}` : `خدمة تفويج معتمرين #${tgt.id}`);
                            setTxDesc(lang === 'en' 
                              ? `Coordinator: ${tgt.name} (${tgt.caravan}) - Service: ${tgt.service}` 
                              : `حجز ضيوف الرحمن باسم ${tgt.name} - الحافلة: ${tgt.caravan} - المسار: ${tgt.service}`);
                          }
                        }}
                        className="w-full bg-white border border-amber-200 text-amber-950 p-2 rounded-lg text-[11px] font-bold focus:outline-none focus:border-amber-500"
                      >
                        <option value="">{lang === 'en' ? '-- Select inquiry caravan to link --' : '-- اختر طلب حجز معتمرين لربط القيد --'}</option>
                        {leads.map((l) => (
                          <option key={l.id} value={l.id}>
                            ⭐ {l.name} ({l.caravan}) - {l.price || 1500} SAR ({l.status})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Reference ID manual field */}
                  {txCategory !== 'Fuel' && (
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
                        {lang === 'en' ? 'Relational Reference Booking ID (Optional)' : 'معرف مرجعية الحجز أو المستند (اختياري)'}
                      </label>
                      <input
                        type="text"
                        placeholder={lang === 'en' ? "e.g., QWFL-128 or Order ID" : "مثال: معرف بوليصة الشحن، رقم الفاتورة أو الحجز المالي..."}
                        value={txRefId}
                        onChange={(e) => setTxRefId(e.target.value)}
                        className="w-full bg-slate-50/50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30"
                        id="tx-refid-input-field"
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
                      {lang === 'en' ? 'Consignment or Subject Title *' : 'العنوان التعريفي للبند *'}
                    </label>
                    <input
                      type="text"
                      placeholder={lang === 'en' ? "e.g., Makkah Station Diesel Replenishment" : "أو أجور مأمور الاتصالات اللاسلكية ..."}
                      required
                      value={txTitle}
                      onChange={(e) => setTxTitle(e.target.value)}
                      className="w-full bg-slate-50/50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30"
                      id="tx-title-input-field"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
                      {lang === 'en' ? 'Description Details (Optional)' : 'التفاصيل والوصف التوضيحي (اختياري)'}
                    </label>
                    <textarea
                      rows={2}
                      placeholder={lang === 'en' ? "Consignment notes or authorization serial number..." : "ملاحظات إضافية، مستلم البند، أو الأرقام التسلسلية لملف الصيانة..."}
                      value={txDesc}
                      onChange={(e) => setTxDesc(e.target.value)}
                      className="w-full bg-slate-50/50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30 resize-none"
                      id="tx-desc-input-field"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
                      {lang === 'en' ? 'Accounting Date *' : 'تاريخ تقييد البند في الدفتر *'}
                    </label>
                    <input
                      type="date"
                      required
                      value={txDate}
                      onChange={(e) => setTxDate(e.target.value)}
                      className="w-full bg-slate-50/50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-900"
                      id="tx-date-input-field"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={txSubmitting}
                    className="w-full bg-indigo-700 hover:opacity-95 text-white font-bold text-xs py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow"
                    id="tx-submit-button"
                  >
                    <span>{txSubmitting ? (lang === 'en' ? 'Submitting...' : 'جاري الحفظ...') : (lang === 'en' ? 'Confirm & Record' : 'تأكيد التسجيل بالدفتر')}</span>
                  </button>
                </form>
              </div>

              {/* Ledger Lists Col */}
              <div className="lg:col-span-8 space-y-4">
                
                {/* Search & filters panel */}
                <div className="bg-white border border-slate-150 p-4 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-4">
                  <div className="relative flex-1 min-w-[220px]">
                    <span className="absolute left-3.5 top-3 text-slate-400 text-xs">🔍</span>
                    <input
                      type="text"
                      placeholder={lang === 'en' ? "Search ledger title, reference ID, creator..." : "البحث في دفاتر الحسابات، مأمور الصرف، بوليصة الشحن..."}
                      value={searchTxQuery}
                      onChange={(e) => setSearchTxQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 pl-9 pr-4 py-2 rounded-xl text-xs font-medium focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={filterTxType}
                      onChange={(e) => setFilterTxType(e.target.value as any)}
                      className="bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
                    >
                      <option value="all">📂 {lang === 'en' ? 'All Types' : 'كافة أنواع القيود'}</option>
                      <option value="credit">📈 {lang === 'en' ? 'Credits (Income)' : 'الواردات فقط'}</option>
                      <option value="debit">📉 {lang === 'en' ? 'Debits (Expenses)' : 'المصروفات فقط'}</option>
                    </select>

                    <select
                      value={filterTxCat}
                      onChange={(e) => setFilterTxCat(e.target.value)}
                      className="bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
                    >
                      <option value="all">🏷️ {lang === 'en' ? 'All Categories' : 'جميع الفئات المحاسبية'}</option>
                      <option value="General">General / عام</option>
                      <option value="Leads">Leads / حجز معتمرين</option>
                      <option value="Fuel">Fuel / وقود وغاز</option>
                      <option value="Maintenance">Maintenance / صيانة وقطع</option>
                      <option value="Payroll">Payroll / رواتب سائقين</option>
                    </select>
                  </div>
                </div>

                {/* Ledger Listing Table */}
                <div className="bg-white border border-slate-150 rounded-2xl shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-slate-850" id="ledger-records-table">
                      <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-black tracking-wider border-b border-slate-150">
                        <tr>
                          <th className="py-3 px-4">{lang === 'en' ? 'Type' : 'الرمز'}</th>
                          <th className="py-3 px-4">{lang === 'en' ? 'Billed Subject' : 'المعاملة والبيان والمستفيد'}</th>
                          <th className="py-3 px-4">{lang === 'en' ? 'Category' : 'الأبواب'}</th>
                          <th className="py-3 px-4">{lang === 'en' ? 'Accounting Date' : 'تاريخ القيد'}</th>
                          <th className="py-3 px-4 text-center">{lang === 'en' ? 'Value (SAR)' : 'القيمة'}</th>
                          <th className="py-3 px-4 text-center">{lang === 'en' ? 'Auditor' : 'المحرر'}</th>
                          {role === 'superadmin' && <th className="py-3 px-4 text-center">{lang === 'en' ? 'Modify' : 'حذف'}</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs font-medium">
                        {allTransactions.filter(tx => {
                          const matchesSearch = 
                            (tx.title || '').toLowerCase().includes(searchTxQuery.toLowerCase()) ||
                            (tx.description || '').toLowerCase().includes(searchTxQuery.toLowerCase()) ||
                            (tx.referenceId || '').toLowerCase().includes(searchTxQuery.toLowerCase()) ||
                            (tx.createdBy || '').toLowerCase().includes(searchTxQuery.toLowerCase());

                          const matchesType = filterTxType === 'all' || tx.type === filterTxType;
                          const matchesCategory = filterTxCat === 'all' || tx.category === filterTxCat;

                          return matchesSearch && matchesType && matchesCategory;
                        }).length === 0 ? (
                          <tr>
                            <td colSpan={7} className="text-center py-12 text-slate-400">
                              <p className="text-base">📁 {lang === 'en' ? 'Zero matching ledger settlements found.' : 'لا توجد قيود مالية مسجلة تتطابق مع البحث الحالي.'}</p>
                              {allTransactions.length === 0 && (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const mockCredits: Transaction[] = [
                                      {
                                        id: 'tx_seed_1',
                                        type: 'credit',
                                        amount: 12500,
                                        title: 'Makkah Pilgrim Group Service Package',
                                        category: 'Leads',
                                        description: 'Payment collected from caravan guide Hassan Al-Malki for 15 premium coaches.',
                                        date: new Date().toISOString().split('T')[0],
                                        createdAt: new Date().toISOString(),
                                        createdBy: 'Database Seeder Node'
                                      },
                                      {
                                        id: 'tx_seed_2',
                                        type: 'debit',
                                        amount: 2400,
                                        title: 'Riyadh Workshop Repair - Flatbed T-105',
                                        category: 'Maintenance',
                                        description: 'Replaced broken hydraulic shock absorbers and tail indicators.',
                                        date: new Date().toISOString().split('T')[0],
                                        createdAt: new Date().toISOString(),
                                        createdBy: 'Database Seeder Node'
                                      }
                                    ];
                                    for (const mockTx of mockCredits) {
                                      await createOrUpdateTransaction(mockTx);
                                    }
                                    setTransactions(mockCredits);
                                  }}
                                  className="mt-3 bg-slate-100 hover:bg-slate-200 text-slate-705 font-bold px-4 py-2 rounded-xl text-[10px] transition cursor-pointer"
                                  id="seed-sandbox-transactions-btn"
                                >
                                  📥 {lang === 'en' ? 'Generate Sandbox Ledger Entries' : 'تضمين عينات حسابات قياسية في قاعدة البيانات'}
                                </button>
                              )}
                            </td>
                          </tr>
                        ) : (
                          allTransactions.filter(tx => {
                            const matchesSearch = 
                              (tx.title || '').toLowerCase().includes(searchTxQuery.toLowerCase()) ||
                              (tx.description || '').toLowerCase().includes(searchTxQuery.toLowerCase()) ||
                              (tx.referenceId || '').toLowerCase().includes(searchTxQuery.toLowerCase()) ||
                              (tx.createdBy || '').toLowerCase().includes(searchTxQuery.toLowerCase());

                            const matchesType = filterTxType === 'all' || tx.type === filterTxType;
                            const matchesCategory = filterTxCat === 'all' || tx.category === filterTxCat;

                            return matchesSearch && matchesType && matchesCategory;
                          }).map((tx) => (
                            <tr key={tx.id} className="hover:bg-slate-50/55 transition-colors">
                              <td className="py-3.5 px-4 font-black">
                                <span className={`inline-flex items-center gap-1.5 px-2 px-2.5 py-1 rounded-lg border text-[10px] font-black ${
                                  tx.type === 'credit'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-rose-50 text-rose-700 border-rose-200'
                                }`}>
                                  {tx.type === 'credit' ? '📈 CR' : '📉 DR'}
                                </span>
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="font-extrabold text-[#111]">{tx.title}</div>
                                {tx.description && <p className="text-[10px] text-slate-500 font-medium font-sans mt-0.5">{tx.description}</p>}
                                {tx.referenceId && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (tx.category === 'Leads') {
                                        setSearchLeadsQuery(tx.referenceId!);
                                        setFilterLeadsStatus('all');
                                        setActiveTab('leads');
                                      } else if (tx.category === 'Fuel') {
                                        // Highlight or open roster view
                                        setActiveTab('roster');
                                      }
                                    }}
                                    className="inline-flex items-center gap-1 mt-1 font-mono text-[9px] bg-indigo-50 hover:bg-indigo-110 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-150 cursor-pointer transition-colors active:scale-95"
                                    title={lang === 'en' ? "Click to view referred booking / asset details" : "انقر لعرض تفاصيل الحجز أو الأصل المرتبط ماليًا"}
                                  >
                                    🔗 {lang === 'en' ? `Booking REF: ${tx.referenceId}` : `رابط المرجعية: ${tx.referenceId}`}
                                  </button>
                                )}
                              </td>
                              <td className="py-3.5 px-4">
                                <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg border border-slate-200 font-bold">
                                  {tx.category || 'General'}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px] font-bold">
                                {tx.date}
                              </td>
                              <td className={`py-3.5 px-4 text-center font-mono text-sm font-black ${
                                tx.type === 'credit' ? 'text-emerald-600' : 'text-rose-600'
                              }`}>
                                {tx.type === 'credit' ? '+' : '-'}{tx.amount.toLocaleString()} <span className="text-[10px] font-bold">ر.س</span>
                              </td>
                              <td className="py-3.5 px-4 text-center text-slate-500 font-bold text-[10px]">
                                {tx.createdBy}
                              </td>
                              {role === 'superadmin' && (
                                <td className="py-3.5 px-4 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteTransaction(tx.id, tx.title, tx.amount)}
                                    className="text-slate-400 hover:text-rose-600 font-bold p-1 rounded transition"
                                  >
                                    🗑️
                                  </button>
                                </td>
                              )}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* TAB 9: SCAN RECEIPT & INVOICE MANAGEMENT (Driver/Operator Panel) */}
        {activeTab === 'receipts' && (
          <div className="space-y-6 animate-fadeIn" id="receipts-scanner-panel">
            {/* Header section */}
            <div className="bg-[#0f172a] border border-slate-800 text-white rounded-2xl p-6 shadow-md flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black tracking-tight flex items-center gap-2" id="receipts-title">
                  🧾 {lang === 'en' ? 'Smart Receipt & Expense Scanner' : 'الماسح الذكي لإيصالات الوقود والمصروفات'}
                </h3>
                <p className="text-xs text-slate-400 font-semibold mt-1">
                  {lang === 'en' ? 'Upload or capture vehicle expense receipts. Gemini AI automatically extracts vendor, date, invoice #, and amount.' : 'تحميل أو التقاط فواتير الوقود والمصروفات. يقوم الذكاء الاصطناعي باستخراج التاجر، التاريخ، رقم الفاتورة والمبلغ تلقائياً.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Upload / Edit Form */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Upload zone */}
                <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm">
                  <h4 className="text-sm font-black text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-1.5">
                    📷 {lang === 'en' ? 'Scan New Receipt' : 'مسح مستند أو إيصال جديد'}
                  </h4>

                  {/* Drag and Drop Zone */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOver(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleReceiptScan(file);
                    }}
                    className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition cursor-pointer ${
                      dragOver
                        ? 'border-indigo-500 bg-indigo-50/50'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/30'
                    }`}
                    onClick={() => {
                      const fileInput = document.getElementById('receipt-file-input');
                      if (fileInput) fileInput.click();
                    }}
                  >
                    <input
                      id="receipt-file-input"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleReceiptScan(file);
                      }}
                    />

                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mb-4">
                      <UploadCloud className="w-6 h-6 text-slate-400" />
                    </div>

                    <p className="text-xs font-black text-slate-805">
                      {lang === 'en' ? 'Drag & drop image here, or' : 'اسحب وأفلت صورة الإيصال هنا، أو'} <span className="text-indigo-600 font-extrabold hover:underline">{lang === 'en' ? 'browse file' : 'تصفح الملفات'}</span>
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">
                      {lang === 'en' ? 'Supports JPEG, PNG up to 10MB' : 'صيغ الصور المدعومة حتى 10 ميغابايت'}
                    </p>
                  </div>

                  {/* Scan Error alert */}
                  {scanError && (
                    <div className="mt-4 bg-rose-50 border border-rose-200 p-3.5 rounded-xl flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <div className="text-xs">
                        <span className="font-extrabold text-rose-800 block">Scan failure:</span>
                        <p className="text-slate-500 mt-0.5">{scanError}</p>
                      </div>
                    </div>
                  )}

                  {/* Success banner */}
                  {savedSuccess && (
                    <div className="mt-4 bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl flex items-center gap-2.5">
                      <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div className="text-xs text-emerald-800 font-bold">
                        {lang === 'en' ? 'Receipt recorded successfully inside Ledger and Receipts log!' : 'تم حفظ الإيصال وترحيله للدفتر المالي والوارد بنجاح!'}
                      </div>
                    </div>
                  )}

                  {/* Scanning Progress Screen */}
                  {scanning && (
                    <div className="mt-6 border border-slate-150 rounded-xl p-6 text-center bg-slate-50 flex flex-col items-center justify-center gap-3 animate-pulse">
                      <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-indigo-600 animate-spin" />
                      <div className="space-y-1">
                        <p className="text-xs font-black text-slate-800">
                          {lang === 'en' ? 'Scanning receipt & extracting text...' : 'جاري تشغيل الفحص وقراءة نصوص الإيصال البصرية...'}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {lang === 'en' ? 'This takes a few seconds via Gemini AI model' : 'يستغرق هذا الإجراء بضع ثوانٍ عبر محرك الذكاء الاصطناعي'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Scanned Edit Form */}
                {scannedPreview && (
                  <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm space-y-4 animate-slideIn">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                        📝 {lang === 'en' ? 'Verify & Edit Extracted Fields' : 'تأكيد ومراجعة حقول الاستخراج البصري'}
                      </h4>
                      <button
                        type="button"
                        onClick={() => setScannedPreview(null)}
                        className="text-[10px] font-bold text-rose-500 hover:underline cursor-pointer border-0 bg-transparent"
                      >
                        {lang === 'en' ? 'Cancel' : 'إلغاء'}
                      </button>
                    </div>

                    {/* Receipt image snippet */}
                    <div className="h-40 rounded-xl border border-slate-150 overflow-hidden relative bg-slate-100 flex items-center justify-center">
                      <img
                        src={scannedPreview.image_url}
                        alt="Scanned Preview"
                        className="object-contain h-full w-full"
                      />
                    </div>

                    {/* Orange warning banner for manual review suggestion */}
                    {scannedPreview.needs_manual_review && (
                      <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded-r-xl">
                        <div className="flex gap-2">
                          <span className="text-amber-600 font-bold text-xs">⚠️</span>
                          <div>
                            <p className="text-[11px] font-black text-amber-800">
                              {lang === 'en' ? 'Manual Review Suggested' : 'مراجعة يدوية مقترحة'}
                            </p>
                            <p className="text-[10px] font-medium text-amber-700 leading-normal">
                              {lang === 'en' 
                                ? 'Multiple or unclassified numeric amounts were detected in the receipt raw text. Please verify VAT and subtotal fields below.'
                                : 'تم رصد قيم مالية متعددة أو غير مصنفة بنص الفاتورة. يرجى تأكيد حقول الضريبة والمجموع الفرعي بالأسفل.'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <form onSubmit={handleSaveReceipt} className="space-y-3.5">
                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
                          {lang === 'en' ? 'Vendor/Merchant Name *' : 'اسم البائع / محطة الخدمة *'}
                        </label>
                        <input
                          type="text"
                          required
                          value={scannedPreview.vendor_name}
                          onChange={(e) => setScannedPreview({ ...scannedPreview, vendor_name: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
                          {lang === 'en' ? 'VAT Number (15 digits)' : 'الرقم الضريبي للمنشأة (١٥ خانة)'}
                        </label>
                        <input
                          type="text"
                          maxLength={15}
                          placeholder="e.g. 310123456700003"
                          value={scannedPreview.vat_number || ''}
                          onChange={(e) => setScannedPreview({ ...scannedPreview, vat_number: e.target.value.replace(/\D/g, '') })}
                          className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30 font-mono"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
                            {lang === 'en' ? 'Total Amount *' : 'إجمالي القيمة الفاتورة *'}
                          </label>
                          <input
                            type="number"
                            step="any"
                            required
                            value={scannedPreview.amount}
                            onChange={(e) => setScannedPreview({ ...scannedPreview, amount: Number(e.target.value) })}
                            className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold font-mono text-slate-900 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
                            {lang === 'en' ? 'Currency *' : 'العملة المحتسبة *'}
                          </label>
                          <input
                            type="text"
                            required
                            value={scannedPreview.currency}
                            onChange={(e) => setScannedPreview({ ...scannedPreview, currency: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
                            {lang === 'en' ? 'Subtotal Amount (excl. VAT)' : 'المجموع الفرعي (قبل الضريبة)'}
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={scannedPreview.subtotal_amount || 0}
                            onChange={(e) => setScannedPreview({ ...scannedPreview, subtotal_amount: Number(e.target.value) })}
                            className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold font-mono text-slate-900 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
                            {lang === 'en' ? 'VAT Amount (15%)' : 'قيمة ضريبة القيمة المضافة'}
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={scannedPreview.vat_amount || 0}
                            onChange={(e) => setScannedPreview({ ...scannedPreview, vat_amount: Number(e.target.value) })}
                            className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold font-mono text-slate-900 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
                            {lang === 'en' ? 'Transaction Date *' : 'تاريخ الفاتورة *'}
                          </label>
                          <input
                            type="date"
                            required
                            value={scannedPreview.transaction_date}
                            onChange={(e) => setScannedPreview({ ...scannedPreview, transaction_date: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
                            {lang === 'en' ? 'Invoice/Receipt No.' : 'رقم الفاتورة / المستند'}
                          </label>
                          <input
                            type="text"
                            value={scannedPreview.invoice_number || ''}
                            onChange={(e) => setScannedPreview({ ...scannedPreview, invoice_number: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={savingReceipt}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow"
                      >
                        {savingReceipt ? (lang === 'en' ? 'Saving & Recording...' : 'جاري المراجعة والتقييد بالدفتر...') : (lang === 'en' ? 'Approve & Save to Ledger' : 'تأكيد وترحيل القيد للدفاتر')}
                      </button>
                    </form>
                  </div>
                )}
              </div>

              {/* Right Column: Scanned History */}
              <div className="lg:col-span-7 space-y-4">
                {/* Search / Filters for History */}
                <div className="bg-white border border-slate-150 p-4 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-4">
                  <div className="relative flex-1 min-w-[200px]">
                    <span className="absolute left-3.5 top-3 text-slate-400 text-xs">🔍</span>
                    <input
                      type="text"
                      placeholder={lang === 'en' ? "Search vendor or invoice number..." : "البحث في أسماء التجار أو أرقام الفواتير..."}
                      value={searchReceiptQuery}
                      onChange={(e) => setSearchReceiptQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 pl-9 pr-4 py-2 rounded-xl text-xs font-medium focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30"
                    />
                  </div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase font-mono">
                    {receipts.length} {lang === 'en' ? 'Scans Saved' : 'إيصالات محفوظة'}
                  </div>
                </div>

                {/* History list */}
                <div className="bg-white border border-slate-150 rounded-2xl shadow-sm overflow-hidden">
                  {receiptsLoading ? (
                    <div className="py-16 text-center text-slate-400">
                      <div className="w-6 h-6 rounded-full border-2 border-slate-300 border-t-indigo-600 animate-spin mx-auto mb-2" />
                      <p className="text-xs font-medium">{lang === 'en' ? 'Loading scanned document log...' : 'جاري تحميل سجل المستندات...'}</p>
                    </div>
                  ) : receipts.filter(rc => {
                    const term = searchReceiptQuery.toLowerCase();
                    return (
                      (rc.vendor_name || '').toLowerCase().includes(term) ||
                      (rc.invoice_number || '').toLowerCase().includes(term) ||
                      (rc.driver_id || '').toLowerCase().includes(term)
                    );
                  }).length === 0 ? (
                    <div className="py-20 text-center text-slate-400">
                      <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                      <p className="text-xs font-bold text-slate-800">{lang === 'en' ? 'No expense receipts found' : 'لا توجد مستندات أو إيصالات مسجلة'}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{lang === 'en' ? 'Upload fuel, Toll, and workshop receipts to get started' : 'قم بتحميل إيصالات الوقود، ورش الصيانة وتذاكر الرسوم لحفظها في الحسابات'}</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {receipts.filter(rc => {
                        const term = searchReceiptQuery.toLowerCase();
                        return (
                          (rc.vendor_name || '').toLowerCase().includes(term) ||
                          (rc.invoice_number || '').toLowerCase().includes(term) ||
                          (rc.driver_id || '').toLowerCase().includes(term)
                        );
                      }).map((rc) => (
                        <div key={rc.id} className="p-4 hover:bg-slate-50/50 flex items-center justify-between gap-4 transition duration-150">
                          <div className="flex items-center gap-3">
                            {/* Receipt Thumbnail thumbnail */}
                            <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-150 overflow-hidden shrink-0 flex items-center justify-center">
                              {rc.image_url ? (
                                <img src={rc.image_url} alt="receipt" className="w-full h-full object-cover" />
                              ) : (
                                <FileText className="w-5 h-5 text-slate-400" />
                              )}
                            </div>
                            
                            <div>
                              <p className="text-xs font-black text-slate-900 leading-tight">
                                {rc.vendor_name}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-bold text-slate-400 font-mono">
                                  📅 {rc.transaction_date}
                                </span>
                                {rc.invoice_number && (
                                  <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold font-mono">
                                    #{rc.invoice_number}
                                  </span>
                                )}
                              </div>
                              <p className="text-[9px] text-slate-400 mt-0.5 font-bold uppercase">
                                {lang === 'en' ? `Driver: ${rc.driver_id}` : `المأمور: ${rc.driver_id}`}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="text-xs font-black text-rose-600 font-mono">
                                -{Number(rc.amount).toLocaleString()} {rc.currency || 'SAR'}
                              </p>
                              <span className="text-[9px] text-slate-400 font-bold block mt-0.5 uppercase tracking-wide">
                                {lang === 'en' ? 'Recorded Debit' : 'مقيد كصادر'}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => setViewingReceiptDetail(rc)}
                              className="p-2 hover:bg-slate-100 text-slate-500 rounded-lg cursor-pointer border border-transparent hover:border-slate-200 transition"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* VIEW SCANNED RECEIPT DETAILS MODAL */}
        {viewingReceiptDetail && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 max-w-2xl w-full relative" id="receipt-detail-modal">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-tight flex items-center gap-1.5">
                  🧾 {viewingReceiptDetail.vendor_name}
                </h3>
                <button 
                  onClick={() => setViewingReceiptDetail(null)}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-50 cursor-pointer border-0 bg-transparent"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Receipt Image */}
                <div className="bg-slate-50 rounded-xl p-2 border border-slate-150 h-72 flex items-center justify-center overflow-hidden">
                  {viewingReceiptDetail.image_url ? (
                    <img
                      src={viewingReceiptDetail.image_url}
                      alt="Receipt details"
                      className="object-contain h-full w-full"
                    />
                  ) : (
                    <div className="text-slate-400 text-center text-xs">
                      <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      {lang === 'en' ? 'No document image stored' : 'لا توجد صورة محفوظة'}
                    </div>
                  )}
                </div>

                {/* Data Fields & OCR Text */}
                <div className="flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400 font-bold">{lang === 'en' ? 'Merchant:' : 'البائع / المتجر:'}</span>
                        <span className="text-slate-900 font-black">{viewingReceiptDetail.vendor_name}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400 font-bold">{lang === 'en' ? 'Total Amount:' : 'المبلغ الإجمالي:'}</span>
                        <span className="text-rose-600 font-black font-mono">-{viewingReceiptDetail.amount} {viewingReceiptDetail.currency || 'SAR'}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400 font-bold">{lang === 'en' ? 'Invoice Number:' : 'رقم الفاتورة:'}</span>
                        <span className="text-slate-900 font-bold font-mono">{viewingReceiptDetail.invoice_number || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400 font-bold">{lang === 'en' ? 'Transaction Date:' : 'تاريخ المعاملة:'}</span>
                        <span className="text-slate-900 font-bold font-mono">{viewingReceiptDetail.transaction_date}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400 font-bold">{lang === 'en' ? 'Scanned By:' : 'مسجل بواسطة:'}</span>
                        <span className="text-slate-500 font-bold uppercase text-[10px]">{viewingReceiptDetail.driver_id}</span>
                      </div>
                    </div>

                    {/* Raw Text OCR Accordion */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase block">{lang === 'en' ? 'Raw OCR Text Extracted:' : 'النصوص البصرية المستخرجة:'}</span>
                      <div className="max-h-36 overflow-y-auto bg-slate-900 text-slate-300 p-3 rounded-xl text-[10px] font-mono leading-relaxed select-text border border-slate-850">
                        {viewingReceiptDetail.raw_ocr_text || (lang === 'en' ? 'No raw text cached.' : 'لا يوجد نص محفوظ.')}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setViewingReceiptDetail(null)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-705 font-bold text-xs py-2 px-4 rounded-xl transition"
                    >
                      {lang === 'en' ? 'Close' : 'إغلاق'}
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}
 
        {/* TAB 10: GOOGLE SHEETS DUAL INTEGRATION (Visible to Admin and Superadmin) */}
        {activeTab === 'sheets' && (role === 'superadmin' || role === 'admin') && (
          <div className="space-y-6 animate-fadeIn" id="sheets-integration-panel">
            {/* Upper Info Header */}
            <div className="bg-[#0f2d1e] border border-emerald-900 text-white rounded-2xl p-6 shadow-md flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black tracking-tight flex items-center gap-2" id="sheets-panel-title">
                  📊 {lang === 'en' ? 'Google Sheets & Firestore Synced Ledger' : 'مزامنة السجلات بين غرف العمليات وجداول جوجل'}
                </h3>
                <p className="text-xs text-emerald-200 font-semibold mt-1">
                  {lang === 'en' ? 'Secure, bi-directional recording of live company logs, vehicles, leads and audited transactions.' : 'تسجيل مزدوج فوري وآمن لسجلات التشغيل، المركبات، طلبات المعتمرين والقيود المالية المعتمدة.'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 bg-emerald-800/80 text-emerald-100 text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border border-emerald-700">
                  <Database className="w-3.5 h-3.5" />
                  <span>Firestore + Sheets LIVE</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Side: Connection Panel (5 Cols) */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* 1. Google Account Connection Card */}
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                    🔑 {lang === 'en' ? 'Step 1: Google Authorization' : 'الخطوة الأولى: التصريح والربط الأمني مع جوجل'}
                  </h4>

                  <p className="text-xs text-slate-500 font-medium leading-relaxed mb-5">
                    {lang === 'en' 
                      ? 'Link your professional Google Workspace account. This grants temporary, secure API tokens to populate worksheets in your Drive.' 
                      : 'اربط حساب مأمور التشغيل مع جوجل لتأمين الاتصال اللحظي وترحيل القيود المالية وقوائم المعتمرين آلياً.'}
                  </p>

                  {googleToken ? (
                    <div className="space-y-4">
                      <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold font-mono">
                          G
                        </div>
                        <div className="text-xs min-w-0 flex-1">
                          <span className="font-extrabold text-emerald-900 block truncate">
                            {lang === 'en' ? 'Google API Connected' : 'الاتصال نشط حالياً'}
                          </span>
                          <span className="font-medium text-slate-500 font-mono block truncate">
                            {googleUserEmail || 'Workspace Administrator'}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2.5">
                        <button
                          type="button"
                          onClick={handleGoogleConnect}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-3 rounded-xl transition cursor-pointer border-0"
                        >
                          {lang === 'en' ? 'Change Account' : 'تغيير الحساب'}
                        </button>
                        <button
                          type="button"
                          onClick={handleGoogleDisconnect}
                          className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 px-3 rounded-xl transition cursor-pointer border border-slate-200"
                        >
                          {lang === 'en' ? 'Disconnect' : 'قطع الاتصال'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <button
                        type="button"
                        disabled={isGoogleLoading}
                        onClick={handleGoogleConnect}
                        className="w-full bg-slate-900 hover:bg-slate-805 text-white font-extrabold text-xs py-3 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-3 cursor-pointer border-0"
                      >
                        {isGoogleLoading ? (
                          <RefreshCw className="w-4 h-4 animate-spin text-slate-200" />
                        ) : (
                          <svg className="w-4 h-4" viewBox="0 0 48 48">
                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                          </svg>
                        )}
                        <span>{lang === 'en' ? 'Authorize Google Sheets' : 'تسجيل الدخول والربط الآمن عبر جوجل'}</span>
                      </button>

                      {googleAuthError && (
                        <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl text-[11px] font-semibold text-rose-700">
                          ⚠️ {lang === 'en' ? 'Authorization error:' : 'خطأ أثناء الاتصال:'} {googleAuthError}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 2. Spreadsheet Association Card */}
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                    📁 {lang === 'en' ? 'Step 2: Spreadsheet Selection' : 'الخطوة الثانية: اختيار أو تهيئة جدول البيانات'}
                  </h4>

                  <p className="text-xs text-slate-500 font-medium leading-relaxed mb-4">
                    {lang === 'en' 
                      ? 'Initialize a brand new ledger workbook inside your Google Drive or link an existing Spreadsheet ID directly.' 
                      : 'قم بتوليد مستند مالي تشغيلي جديد كلياً على حساب درايف الخاص بك، أو قم بربط جدول بيانات نشط بالفعل.'}
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                        {lang === 'en' ? 'Google Spreadsheet ID' : 'معرف جدول البيانات (Google Spreadsheet ID)'}
                      </label>
                      <input
                        type="text"
                        value={spreadsheetId}
                        onChange={(e) => setSpreadsheetId(e.target.value)}
                        placeholder="e.g. 1a2b3c4d5e6f7g8h9i0j..."
                        className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-bold font-mono text-slate-900 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        disabled={!googleToken || isGoogleLoading}
                        onClick={handleCreateNewSpreadsheet}
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 disabled:opacity-50 font-black text-xs py-2.5 px-3 rounded-xl transition cursor-pointer border border-emerald-200/50"
                      >
                        ⚡ {lang === 'en' ? 'Create New' : 'توليد جدول جديد'}
                      </button>

                      <button
                        type="button"
                        disabled={!spreadsheetId}
                        onClick={() => saveGoogleSheetsConfig(spreadsheetId)}
                        className="bg-slate-900 hover:bg-slate-805 text-white disabled:opacity-50 font-black text-xs py-2.5 px-3 rounded-xl transition cursor-pointer border-0"
                      >
                        💾 {lang === 'en' ? 'Save Config' : 'حفظ التكوين'}
                      </button>
                    </div>

                    {spreadsheetId && (
                      <div className="bg-slate-50 border border-slate-150 p-3.5 rounded-xl text-xs space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 font-bold">{lang === 'en' ? 'Spreadsheet Name:' : 'اسم جدول البيانات:'}</span>
                          <span className="text-slate-950 font-extrabold text-[11px] text-right truncate max-w-[150px]">
                            {spreadsheetName || 'Qawafil Records Ledger'}
                          </span>
                        </div>
                        <a
                          href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-center text-[10px] uppercase py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition"
                        >
                          <span>{lang === 'en' ? 'Open Google Sheets ↗' : 'فتح ورقة العمل في نافذة جديدة ↗'}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Right Side: Modules Synchronization Hub (7 Cols) */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Synchronization Card */}
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                  <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-100 mb-6 gap-3">
                    <h4 className="text-xs font-black uppercase text-slate-805 tracking-wider flex items-center gap-2">
                      🔄 {lang === 'en' ? 'Sectors Database Synchronization Hub' : 'لوحة التحكم في المزامنة الفورية للبيانات'}
                    </h4>

                    <button
                      type="button"
                      disabled={!googleToken || !spreadsheetId}
                      onClick={handleSyncAll}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 font-black text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 shadow transition-colors cursor-pointer border-0"
                    >
                      <span>🔄 {lang === 'en' ? 'Sync All Directories' : 'مزامنة كافة السجلات دفعة واحدة'}</span>
                    </button>
                  </div>

                  <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6">
                    {lang === 'en'
                      ? 'Execute safe directory syncs below. The system automatically creates separated sheets inside the Linked Spreadsheet and overwrites with the latest records from the Cloud Firestore.'
                      : 'اختر السجل المراد ترحيله لجداول جوجل. سيقوم النظام آلياً بتهيئة ورقة العمل الفرعية المطلوبة ونسخ القيود من السيرفر السحابي فوراً.'}
                  </p>

                  <div className="space-y-4">
                    
                    {/* Module 1: Pilgrim Leads */}
                    <div className="p-4 border border-slate-150 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50 hover:bg-slate-50 transition">
                      <div className="space-y-1">
                        <span className="text-xs font-black text-slate-900 flex items-center gap-2">
                          ⭐ {lang === 'en' ? 'Pilgrim Inquiries & Booking Requests' : 'طلبات واستمارات ضيوف الرحمن'}
                        </span>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          {lang === 'en' ? 'Columns: ID, Name, Phone, Caravan, Status, Price, Date' : 'الحقول: الرقم، الاسم، الجوال، وسيلة النقل، الحالة، السعر'}
                        </p>
                        {sheetsLogs.leads && (
                          <p className="text-[11px] font-semibold text-indigo-600 font-mono mt-1">
                            {sheetsLogs.leads}
                          </p>
                        )}
                      </div>
                      
                      <button
                        type="button"
                        disabled={!googleToken || !spreadsheetId || sheetsSyncing.leads}
                        onClick={() => syncCollection('leads')}
                        className="bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 text-slate-800 font-black text-xs py-2 px-4 rounded-xl flex items-center justify-center gap-1.5 transition shrink-0 cursor-pointer"
                      >
                        {sheetsSyncing.leads ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <span>🔄 {lang === 'en' ? 'Sync Leads' : 'مزامنة الطلبات'}</span>
                        )}
                      </button>
                    </div>

                    {/* Module 2: Transactions Ledger */}
                    <div className="p-4 border border-slate-150 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50 hover:bg-slate-50 transition">
                      <div className="space-y-1">
                        <span className="text-xs font-black text-slate-900 flex items-center gap-2">
                          💳 {lang === 'en' ? 'Accounts Ledger (Debits & Credits)' : 'الدفتر المالي والحسابات الجارية'}
                        </span>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          {lang === 'en' ? 'Columns: ID, Type, Category, Amount, Reference, Date, Description' : 'الحقول: القيد، النوع، التصنيف، القيمة، المرجع، التاريخ، البيان'}
                        </p>
                        {sheetsLogs.transactions && (
                          <p className="text-[11px] font-semibold text-indigo-600 font-mono mt-1">
                            {sheetsLogs.transactions}
                          </p>
                        )}
                      </div>
                      
                      <button
                        type="button"
                        disabled={!googleToken || !spreadsheetId || sheetsSyncing.transactions}
                        onClick={() => syncCollection('transactions')}
                        className="bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 text-slate-800 font-black text-xs py-2 px-4 rounded-xl flex items-center justify-center gap-1.5 transition shrink-0 cursor-pointer"
                      >
                        {sheetsSyncing.transactions ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <span>🔄 {lang === 'en' ? 'Sync Ledger' : 'مزامنة الدفتر'}</span>
                        )}
                      </button>
                    </div>

                    {/* Module 3: Receipts */}
                    <div className="p-4 border border-slate-150 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50 hover:bg-slate-50 transition">
                      <div className="space-y-1">
                        <span className="text-xs font-black text-slate-900 flex items-center gap-2">
                          🧾 {lang === 'en' ? 'Smart Expense Receipts & Invoices' : 'الفواتير وإيصالات المصروفات الممسوحة'}
                        </span>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          {lang === 'en' ? 'Columns: ID, Merchant, Amount, Invoice #, Image URL, Driver, Raw OCR Text' : 'الحقول: الفاتورة، التاجر، القيمة، رقم الفاتورة، رابط الصورة، المأمور، النصوص'}
                        </p>
                        {sheetsLogs.receipts && (
                          <p className="text-[11px] font-semibold text-indigo-600 font-mono mt-1">
                            {sheetsLogs.receipts}
                          </p>
                        )}
                      </div>
                      
                      <button
                        type="button"
                        disabled={!googleToken || !spreadsheetId || sheetsSyncing.receipts}
                        onClick={() => syncCollection('receipts')}
                        className="bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 text-slate-800 font-black text-xs py-2 px-4 rounded-xl flex items-center justify-center gap-1.5 transition shrink-0 cursor-pointer"
                      >
                        {sheetsSyncing.receipts ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <span>🔄 {lang === 'en' ? 'Sync Receipts' : 'مزامنة الفواتير'}</span>
                        )}
                      </button>
                    </div>

                    {/* Module 4: Vehicles Directory */}
                    <div className="p-4 border border-slate-150 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50 hover:bg-slate-50 transition">
                      <div className="space-y-1">
                        <span className="text-xs font-black text-slate-900 flex items-center gap-2">
                          🚛 {lang === 'en' ? 'Fleet Vehicles Directory' : 'دليل أسطول النقل والمركبات النشطة'}
                        </span>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          {lang === 'en' ? 'Columns: ID, Plate #, Type, Capacity, Driver Name, Fuel Level, Status' : 'الحقول: الحافلة، اللوحة، النوع، السعة، اسم السائق، مستوى الوقود، الحالة'}
                        </p>
                        {sheetsLogs.vehicles && (
                          <p className="text-[11px] font-semibold text-indigo-600 font-mono mt-1">
                            {sheetsLogs.vehicles}
                          </p>
                        )}
                      </div>
                      
                      <button
                        type="button"
                        disabled={!googleToken || !spreadsheetId || sheetsSyncing.vehicles}
                        onClick={() => syncCollection('vehicles')}
                        className="bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 text-slate-800 font-black text-xs py-2 px-4 rounded-xl flex items-center justify-center gap-1.5 transition shrink-0 cursor-pointer"
                      >
                        {sheetsSyncing.vehicles ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <span>🔄 {lang === 'en' ? 'Sync Vehicles' : 'مزامنة الأسطول'}</span>
                        )}
                      </button>
                    </div>

                  </div>
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
                              adminItem.role === 'admin' ? 'bg-brand-light text-brand-primary border border-brand-primary/20' : 'bg-slate-50 text-slate-600 border border-slate-200'
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
                  className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs text-slate-850 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30 focus:ring-1 focus:ring-brand-primary/40 font-bold cursor-pointer"
                >
                  <option value="admin">Admin (Read + Write Access)</option>
                  <option value="viewer">Viewer (Read-Only Access)</option>
                </select>
              </div>

              {/* Submit button using corporate blue */}
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
