import { UserRole, ROLE_ROUTES } from '@/types/Supervisor';

/**
 * Get the appropriate dashboard route for a user based on their role
 */
export const getDashboardRoute = (role: UserRole): string => {
  return ROLE_ROUTES[role] || '/login';
};

/**
 * Check if a user has access to a specific route
 */
export const hasAccessToRoute = (
  userRole: UserRole,
  routePath: string
): boolean => {
  const supervisorRoutes = {
    '/assembly-supervisor': 'assembly_supervisor',
    '/production-supervisor': 'production_supervisor',
    '/Admin': 'admin',
    '/Superuser': 'superuser',
  } as Record<string, UserRole>;

  for (const [route, requiredRole] of Object.entries(supervisorRoutes)) {
    if (routePath.startsWith(route)) {
      return userRole === requiredRole;
    }
  }

  // Allow access to public routes
  return true;
};

/**
 * Format time for display
 */
export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

/**
 * Format duration in minutes to human-readable string
 */
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

/**
 * Calculate percentage difference
 */
export const calculatePercentageDifference = (
  actual: number,
  target: number
): number => {
  if (target === 0) return 0;
  return ((actual - target) / target) * 100;
};

/**
 * Get status badge color
 */
export const getStatusBadgeColor = (
  status: string
): string => {
  switch (status) {
    case 'active':
    case 'running':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'idle':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'maintenance':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'error':
      return 'bg-red-100 text-red-800 border-red-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

/**
 * Get efficiency color based on percentage
 */
export const getEfficiencyColor = (efficiency: number): string => {
  if (efficiency >= 90) return 'text-green-600';
  if (efficiency >= 75) return 'text-yellow-600';
  return 'text-red-600';
};

/**
 * Round number to specified decimal places
 */
export const roundTo = (number: number, decimals: number = 2): number => {
  return Math.round(number * Math.pow(10, decimals)) / Math.pow(10, decimals);
};
