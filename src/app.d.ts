import type { SupabaseClient } from '@supabase/supabase-js';

declare global {
	namespace App {
		interface Locals {
			supabase: SupabaseClient;
			getUser: () => Promise<{ id: string; email: string | null } | null>;
		}
	}
}

export {};
