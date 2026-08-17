export type UserRole = 
  | 'admin' 
  | 'superuser' 
  | 'assembly_supervisor' 
  | 'production_supervisor';

export interface SupervisorUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  assignedLines: string[];
  department?: 'assembly' | 'production';
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthContextType {
  user: SupervisorUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: SupervisorUser | null) => void;
}

export interface LineData {
  id: string;
  name: string;
  status: 'active' | 'idle' | 'maintenance' | 'error';
  production: {
    target: number;
    actual: number;
    efficiency: number;
  };
  machines: MachineData[];
  shift: {
    startTime: string;
    endTime: string;
    supervisor: string;
  };
}

export interface MachineData {
  id: string;
  name: string;
  status: 'running' | 'idle' | 'error' | 'maintenance';
  uptime: number;
  downtime: number;
  oee: number;
  availability: number;
  performance: number;
  quality: number;
}

export interface ProductionMetrics {
  totalProduction: number;
  targetProduction: number;
  efficiency: number;
  oee: number;
  downtime: number;
  plannedDowntime: number;
  unplannedDowntime: number;
  timestamp: string;
}

export interface ShiftData {
  id: string;
  shiftNumber: 1 | 2 | 3;
  startTime: string;
  endTime: string;
  supervisor: SupervisorUser;
  lines: LineData[];
  production: ProductionMetrics;
}

export interface DowntimeAlert {
  id: string;
  lineId: string;
  machineId?: string;
  type: 'planned' | 'unplanned';
  severity: 'low' | 'medium' | 'high' | 'critical';
  startTime: string;
  endTime?: string;
  reason: string;
  duration: number;
  status: 'ongoing' | 'resolved';
}

export const ROLE_ROUTES: Record<UserRole, string> = {
  admin: '/Admin',
  superuser: '/Superuser',
  assembly_supervisor: '/assembly-supervisor',
  production_supervisor: '/production-supervisor',
};

export const isAssemblySupervisor = (role: UserRole): boolean => 
  role === 'assembly_supervisor';

export const isProductionSupervisor = (role: UserRole): boolean => 
  role === 'production_supervisor';

export const isSupervisor = (role: UserRole): boolean => 
  role === 'assembly_supervisor' || role === 'production_supervisor';
