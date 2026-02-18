import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Returns true only for the "master admin":
 * an admin that has NO explicit permission rows (full access = master).
 * Secondary admins have explicit permission rows and cannot see financial values.
 */
export function useCanViewFinancialValues() {
  const { data: currentUser } = useQuery({
    queryKey: ['current-user-fin'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
    staleTime: 60000,
  });

  const { data: canView, isLoading } = useQuery({
    queryKey: ['can-view-financial-values', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return false;

      // Check if this user has any explicit permission rows
      const { data, error } = await supabase
        .from('admin_permissions')
        .select('id')
        .eq('user_id', currentUser.id)
        .limit(1);

      if (error) return true; // On error, default to showing (fail open for master)

      // No permission rows = master admin = can view all financial values
      const isMaster = !data || data.length === 0;
      return isMaster;
    },
    enabled: !!currentUser?.id,
    staleTime: 30000,
  });

  return {
    canViewFinancialValues: isLoading ? false : (canView ?? false),
    isLoading,
  };
}
