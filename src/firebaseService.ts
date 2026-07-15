import { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from './firebase';
import { Vehicle, CargoOrder, Folder, UserFile, UserNote, TeamMember, UserProfile, HomepageLead, Transaction } from './types';
import { INITIAL_VEHICLES, INITIAL_CARGO_ORDERS } from './data';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Service Methods for Qawafil Al Majd Al Mithaliya

export async function fetchAllVehicles(): Promise<Vehicle[]> {
  const path = 'vehicles';
  try {
    const querySnapshot = await getDocs(collection(db, path));
    const list: Vehicle[] = [];
    querySnapshot.forEach((d) => {
      list.push(d.data() as Vehicle);
    });
    
    if (list.length === 0) {
      // Seed initial data into localstorage and return fallback if nothing in cloud
      const local = localStorage.getItem('qawafil_vehicles');
      if (local) {
        return JSON.parse(local);
      }
      localStorage.setItem('qawafil_vehicles', JSON.stringify(INITIAL_VEHICLES));
      return INITIAL_VEHICLES;
    }
    
    // Cache to localstorage for speed/safety
    localStorage.setItem('qawafil_vehicles', JSON.stringify(list));
    return list;
  } catch (error) {
    console.warn("Could not fetch vehicles from Firestore; serving offline cached copy.", error);
    const local = localStorage.getItem('qawafil_vehicles');
    return local ? JSON.parse(local) : INITIAL_VEHICLES;
  }
}

export async function createOrUpdateVehicle(vehicle: Vehicle): Promise<void> {
  const path = 'vehicles';
  try {
    await setDoc(doc(db, path, vehicle.id), vehicle);
    // sync cache
    const current = localStorage.getItem('qawafil_vehicles');
    const list: Vehicle[] = current ? JSON.parse(current) : [];
    const index = list.findIndex(v => v.id === vehicle.id);
    if (index >= 0) {
      list[index] = vehicle;
    } else {
      list.push(vehicle);
    }
    localStorage.setItem('qawafil_vehicles', JSON.stringify(list));
  } catch (error) {
    // If permission or schema validation error occurs, catch it and raise the mandated error!
    // Or save locally if offline
    console.error("Firebase write failed. Triggering standard error handler.");
    handleFirestoreError(error, OperationType.WRITE, `${path}/${vehicle.id}`);
  }
}

export async function fetchAllCargoOrders(): Promise<CargoOrder[]> {
  const path = 'cargoOrders';
  try {
    const querySnapshot = await getDocs(collection(db, path));
    const list: CargoOrder[] = [];
    querySnapshot.forEach((d) => {
      list.push(d.data() as CargoOrder);
    });

    if (list.length === 0) {
      const local = localStorage.getItem('qawafil_orders');
      if (local) {
        return JSON.parse(local);
      }
      localStorage.setItem('qawafil_orders', JSON.stringify(INITIAL_CARGO_ORDERS));
      return INITIAL_CARGO_ORDERS;
    }

    localStorage.setItem('qawafil_orders', JSON.stringify(list));
    return list;
  } catch (error) {
    console.warn("Could not fetch cargo orders from Firestore; serving offline cached copy.", error);
    const local = localStorage.getItem('qawafil_orders');
    return local ? JSON.parse(local) : INITIAL_CARGO_ORDERS;
  }
}

export async function createOrUpdateCargoOrder(order: CargoOrder): Promise<void> {
  const path = 'cargoOrders';
  try {
    await setDoc(doc(db, path, order.id), order);
    const current = localStorage.getItem('qawafil_orders');
    const list: CargoOrder[] = current ? JSON.parse(current) : [];
    const index = list.findIndex(o => o.id === order.id);
    if (index >= 0) {
      list[index] = order;
    } else {
      list.push(order);
    }
    localStorage.setItem('qawafil_orders', JSON.stringify(list));
  } catch (error) {
    console.error("Firebase write failed for Order. Triggering standard error handler.");
    handleFirestoreError(error, OperationType.WRITE, `${path}/${order.id}`);
  }
}

// ====================
// User Profile Actions
// ====================

export async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  const path = `users/${uid}`;
  try {
    const docRef = doc(db, 'users', uid);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { uid, ...snap.data() } as UserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

// Helper to sanitize objects for Firestore by removing keys with 'undefined' values
function cleanData(obj: any): any {
  const cleaned: any = {};
  Object.keys(obj).forEach((key) => {
    if (obj[key] !== undefined) {
      cleaned[key] = obj[key];
    }
  });
  return cleaned;
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  const path = `users/${profile.uid}`;
  try {
    const { uid, ...rest } = profile;
    await setDoc(doc(db, 'users', uid), cleanData(rest));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ====================
// Folders Actions
// ====================

export async function fetchFolders(uid: string): Promise<Folder[]> {
  const path = `users/${uid}/folders`;
  try {
    const querySnapshot = await getDocs(collection(db, 'users', uid, 'folders'));
    const list: Folder[] = [];
    querySnapshot.forEach((d) => {
      list.push({ id: d.id, ...d.data() } as Folder);
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function saveFolder(uid: string, folder: Folder): Promise<void> {
  const path = `users/${uid}/folders/${folder.id}`;
  try {
    const { id, ...rest } = folder;
    await setDoc(doc(db, 'users', uid, 'folders', id), cleanData(rest));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteFolder(uid: string, folderId: string): Promise<void> {
  const path = `users/${uid}/folders/${folderId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'folders', folderId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ====================
// Files Actions
// ====================

export async function fetchFiles(uid: string): Promise<UserFile[]> {
  const path = `users/${uid}/files`;
  try {
    const querySnapshot = await getDocs(collection(db, 'users', uid, 'files'));
    const list: UserFile[] = [];
    querySnapshot.forEach((d) => {
      list.push({ id: d.id, ...d.data() } as UserFile);
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function saveFileMetadata(uid: string, file: UserFile): Promise<void> {
  const path = `users/${uid}/files/${file.id}`;
  try {
    const { id, ...rest } = file;
    await setDoc(doc(db, 'users', uid, 'files', id), cleanData(rest));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteFileMetadata(uid: string, fileId: string): Promise<void> {
  const path = `users/${uid}/files/${fileId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'files', fileId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ====================
// Notes Actions
// ====================

export async function fetchNotes(uid: string): Promise<UserNote[]> {
  const path = `users/${uid}/notes`;
  try {
    const querySnapshot = await getDocs(collection(db, 'users', uid, 'notes'));
    const list: UserNote[] = [];
    querySnapshot.forEach((d) => {
      list.push({ id: d.id, ...d.data() } as UserNote);
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function saveNote(uid: string, note: UserNote): Promise<void> {
  const path = `users/${uid}/notes/${note.id}`;
  try {
    const { id, ...rest } = note;
    await setDoc(doc(db, 'users', uid, 'notes', id), cleanData(rest));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteNote(uid: string, noteId: string): Promise<void> {
  const path = `users/${uid}/notes/${noteId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'notes', noteId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ====================
// Team Members Actions
// ====================

export async function fetchTeamMembers(uid: string): Promise<TeamMember[]> {
  const path = `users/${uid}/teamMembers`;
  try {
    const querySnapshot = await getDocs(collection(db, 'users', uid, 'teamMembers'));
    const list: TeamMember[] = [];
    querySnapshot.forEach((d) => {
      list.push({ id: d.id, ...d.data() } as TeamMember);
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function saveTeamMember(uid: string, member: TeamMember): Promise<void> {
  const path = `users/${uid}/teamMembers/${member.id}`;
  try {
    const { id, ...rest } = member;
    await setDoc(doc(db, 'users', uid, 'teamMembers', id), cleanData(rest));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteTeamMember(uid: string, memberId: string): Promise<void> {
  const path = `users/${uid}/teamMembers/${memberId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'teamMembers', memberId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ====================
// Lead Actions (Homepage Pilgrim inquiries)
// ====================

export async function fetchAllLeads(): Promise<HomepageLead[]> {
  const path = 'leads';
  try {
    const querySnapshot = await getDocs(collection(db, path));
    const list: HomepageLead[] = [];
    querySnapshot.forEach((d) => {
      list.push({ id: d.id, ...d.data() } as HomepageLead);
    });

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

    // Sort by recent first (createdAt descending)
    return list.sort((a, b) => getCreatedAtTime(b.createdAt) - getCreatedAtTime(a.createdAt));
  } catch (error) {
    console.warn("Could not fetch leads from Firestore. Serving offline fallback.", error);
    const local = localStorage.getItem('qawafil_leads');
    return local ? JSON.parse(local) : [];
  }
}

export async function saveLead(lead: HomepageLead): Promise<void> {
  const path = 'leads';
  try {
    await setDoc(doc(db, path, lead.id), cleanData(lead));
    
    // Sync to local cache
    const current = localStorage.getItem('qawafil_leads');
    const list: HomepageLead[] = current ? JSON.parse(current) : [];
    
    // Convert serverTimestamp FieldValue to ISO string for offline storage
    const normalizedLead = {
      ...lead,
      createdAt: typeof lead.createdAt === 'object' && lead.createdAt !== null 
        ? new Date().toISOString() 
        : lead.createdAt
    };

    const index = list.findIndex(l => l.id === lead.id);
    if (index >= 0) {
      list[index] = normalizedLead;
    } else {
      list.unshift(normalizedLead);
    }
    localStorage.setItem('qawafil_leads', JSON.stringify(list));
  } catch (error) {
    console.error("Firebase write failed for Lead. Triggering standard error handler.");
    handleFirestoreError(error, OperationType.WRITE, `${path}/${lead.id}`);
  }
}

export async function updateLeadStatus(id: string, status: 'Pending' | 'Contacted' | 'Closed'): Promise<void> {
  const path = `leads/${id}`;
  try {
    await updateDoc(doc(db, 'leads', id), { status });
    
    // Update cache
    const current = localStorage.getItem('qawafil_leads');
    if (current) {
      const list: HomepageLead[] = JSON.parse(current);
      const item = list.find(l => l.id === id);
      if (item) {
        item.status = status;
        localStorage.setItem('qawafil_leads', JSON.stringify(list));
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteLead(id: string): Promise<void> {
  const path = `leads/${id}`;
  try {
    await deleteDoc(doc(db, 'leads', id));
    
    // Update cache
    const current = localStorage.getItem('qawafil_leads');
    if (current) {
      const list: HomepageLead[] = JSON.parse(current);
      const filtered = list.filter(l => l.id !== id);
      localStorage.setItem('qawafil_leads', JSON.stringify(filtered));
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ====================
// Transactions Ledger Actions
// ====================

export async function fetchAllTransactions(): Promise<Transaction[]> {
  const path = 'transactions';
  try {
    const querySnapshot = await getDocs(collection(db, path));
    const list: Transaction[] = [];
    querySnapshot.forEach((d) => {
      list.push({ id: d.id, ...d.data() } as Transaction);
    });

    // Sort by recent first
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.warn("Could not fetch transactions from Firestore. Serving cached offline copy.", error);
    const local = localStorage.getItem('qawafil_transactions');
    return local ? JSON.parse(local) : [];
  }
}

export async function createOrUpdateTransaction(transaction: Transaction): Promise<void> {
  const path = 'transactions';
  try {
    await setDoc(doc(db, path, transaction.id), cleanData(transaction));
    
    // Sync cache
    const current = localStorage.getItem('qawafil_transactions');
    const list: Transaction[] = current ? JSON.parse(current) : [];
    const index = list.findIndex(t => t.id === transaction.id);
    if (index >= 0) {
      list[index] = transaction;
    } else {
      list.unshift(transaction);
    }
    localStorage.setItem('qawafil_transactions', JSON.stringify(list));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${path}/${transaction.id}`);
  }
}

export async function deleteTransaction(id: string): Promise<void> {
  const path = `transactions/${id}`;
  try {
    await deleteDoc(doc(db, 'transactions', id));
    
    // Sync cache
    const current = localStorage.getItem('qawafil_transactions');
    if (current) {
      const list: Transaction[] = JSON.parse(current);
      const filtered = list.filter(t => t.id !== id);
      localStorage.setItem('qawafil_transactions', JSON.stringify(filtered));
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}


