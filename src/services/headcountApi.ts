import { supabase } from '../lib/supabase';

/**
 * Fetches the global signup headcount directly from Supabase.
 * This counts all entries in the 'profiles' table, which are created
 * automatically upon successful Auth registration.
 */
export const getGlobalHeadcount = async (): Promise<number | null> => {
    if (!supabase) return null;

    try {
        // Option 1: Direct count (requires RLS to allow select)
        // const { count, error } = await supabase
        //     .from('profiles')
        //     .select('*', { count: 'exact', head: true });

        // Option 2: Use an RPC function for better security/performance if available
        const { data, error } = await supabase.rpc('get_user_count');

        if (error) {
            // Fallback to direct count if RPC doesn't exist yet
            const { count: directCount, error: directError } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true });

            if (directError) return null;
            return directCount;
        }

        return data as number;
    } catch {
        return null;
    }
};

/**
 * @deprecated Registration is now handled primarily via supabase.auth.signUp
 */
export const registerGlobalUser = async (email: string): Promise<number | null> => {
    return getGlobalHeadcount();
};

/**
 * @deprecated Login events are now handled primarily by supabase.auth session management
 */
export const recordGlobalLogin = async (email: string): Promise<boolean> => {
    return true;
};
