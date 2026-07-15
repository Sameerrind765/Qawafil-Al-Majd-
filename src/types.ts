export interface Vehicle {
  id: string; // Document ID/custom ID
  plateNumber: string;
  type: 'Water Tanker' | 'Heavy Trailer' | 'Flatbed Truck' | 'Passenger Bus' | 'Excavator';
  driverName: string;
  driverPhone: string;
  status: 'Available' | 'In Transit' | 'Maintenance' | 'Off Duty';
  location: {
    lat: number;
    lng: number;
    city: string;
  };
  capacity: string; // e.g. "19,000 Liters", "25 Tons", "50 Seats"
  fuelLevel: number; // Percentage
  lastMaintenance: string;
}

export interface CargoOrder {
  id: string;
  clientName: string;
  clientPhone: string;
  vehicleType: string;
  origin: string;
  destination: string;
  cargoType: string; // e.g. "Water Delivery", "Cement", "Steel Bars", "Asphalt"
  weightOrVolume: string; // e.g. "19,000L", "20 Tons"
  status: 'Pending' | 'Assigned' | 'In Transit' | 'Completed' | 'Cancelled';
  assignedVehicleId?: string;
  estimatedPrice: number; // of SAR (Saudi Riyal)
  createdAt: string;
  notes?: string;
}

export interface MaintenanceJob {
  id: string;
  vehicleId: string;
  plateNumber: string;
  vehicleType: string;
  issue: string;
  cost: number; // SAR
  status: 'Scheduled' | 'In Progress' | 'Resolved';
  date: string;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  type: 'info' | 'warning' | 'success';
  actor: string;
  message: string;
}

export interface UserProfile {
  uid: string;
  displayName?: string;
  email: string;
  plan?: string;
  createdAt: string;
}

export interface Folder {
  id: string;
  name: string;
  createdAt: string;
}

export interface UserFile {
  id: string;
  name: string;
  folderId?: string;
  size: string;
  createdAt: string;
}

export interface UserNote {
  id: string;
  title: string;
  content?: string;
  createdAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role?: string;
  createdAt: string;
}

export interface HomepageLead {
  id: string;
  name: string;
  phone: string;
  service: string;
  caravan: string;
  customStation: string;
  createdAt: any;
  status: 'Pending' | 'Contacted' | 'Closed';
  date?: string;
  time?: string;
  price?: number; // Estimated booking revenue SAR
}

export interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  title: string;
  description: string;
  category?: 'Leads' | 'Cargo' | 'Fuel' | 'Maintenance' | 'Payroll' | 'General';
  referenceId?: string; // leadId or orderId or vehicleId
  date: string; // YYYY-MM-DD
  createdAt: string; // ISO String
  createdBy: string; // User Name / Dispatched Name
}

