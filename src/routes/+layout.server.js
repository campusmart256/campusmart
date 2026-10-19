/** Shared session, navigation, and notification counts for every page. */

/**
 * Original navigation lookups, retained as a fallback if the consolidated RPC fails.
 * @param {any} supabase
 * @param {string} userId
 */
async function loadLegacyNavigation(supabase, userId) {
    let profile = null;
    let isStaff = false;
    let staffRole = null;
    let unreadMessages = 0;
    let pendingVerificationRequests = 0;
    let pendingReports = 0;
    let savedPriceDropAlerts = 0;

    const [profileResult, staffResult, conversationsResult, savedResult] = await Promise.all([
        supabase
            .from('profiles')
            .select('display_name, verification_status, avatar_path')
            .eq('id', userId)
            .maybeSingle(),
        supabase
            .from('staff')
            .select('role')
            .eq('user_id', userId)
            .maybeSingle(),
        supabase
            .from('conversations')
            .select('id')
            .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
            .limit(200),
        supabase
            .from('saved_listings')
            .select('listing_id, price_when_saved_ugx, price_alert_dismissed_ugx')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(200)
    ]);

    profile = profileResult.data ?? null;
    isStaff = !!staffResult.data;
    staffRole = staffResult.data?.role ?? null;

    const staffCountsPromise = (async () => {
        if (!isStaff) return;

        const [pendingResult, reportsResult] = await Promise.all([
            supabase
                .from('verification_requests')
                .select('id', { count: 'exact', head: true })
                .eq('status', 'pending'),
            supabase
                .from('reports')
                .select('id', { count: 'exact', head: true })
                .eq('status', 'open')
        ]);

        if (pendingResult.error) {
            console.error('pending verification count failed:', pendingResult.error.code, pendingResult.error.message);
        } else {
            pendingVerificationRequests = pendingResult.count ?? 0;
        }

        if (reportsResult.error) {
            console.error('pending reports count failed:', reportsResult.error.code, reportsResult.error.message);
        } else {
            pendingReports = reportsResult.count ?? 0;
        }
    })();

    const savedAlertsPromise = (async () => {
        if (savedResult.error) {
            console.error('saved price alert lookup failed:', savedResult.error.code, savedResult.error.message);
            return;
        }

        const savedRows = /** @type {{listing_id: string, price_when_saved_ugx: number, price_alert_dismissed_ugx: number | null}[]} */ (savedResult.data ?? []);
        const savedIds = savedRows.map((item) => item.listing_id);
        if (savedIds.length === 0) return;

        const listingResult = await supabase
            .from('listings')
            .select('id, price_ugx, expires_at')
            .in('id', savedIds)
            .eq('status', 'active');

        if (listingResult.error) {
            console.error('saved price alert listing lookup failed:', listingResult.error.code, listingResult.error.message);
            return;
        }

        const now = Date.now();
        const visiblePrices = new Map(
            (/** @type {{id: string, price_ugx: number, expires_at: string | null}[]} */ (listingResult.data ?? []))
                .filter((listing) => !listing.expires_at || new Date(listing.expires_at).getTime() > now)
                .map((listing) => [listing.id, listing.price_ugx])
        );

        savedPriceDropAlerts = savedRows.filter((item) => {
            const currentPrice = visiblePrices.get(item.listing_id);
            if (typeof currentPrice !== 'number') return false;
            return currentPrice < item.price_when_saved_ugx &&
                (item.price_alert_dismissed_ugx == null || currentPrice < item.price_alert_dismissed_ugx);
        }).length;
    })();

    const unreadPromise = (async () => {
        const conversationIds = (/** @type {{id: string}[]} */ (conversationsResult.data ?? [])).map((conversation) => conversation.id);
        if (conversationIds.length === 0) return;

        const unreadResult = await supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .in('conversation_id', conversationIds)
            .neq('sender_id', userId)
            .is('read_at', null);

        unreadMessages = unreadResult.count ?? 0;
    })();

    await Promise.all([staffCountsPromise, savedAlertsPromise, unreadPromise]);

    return {
        profile,
        isStaff,
        staffRole,
        unreadMessages,
        pendingVerificationRequests,
        pendingReports,
        savedPriceDropAlerts
    };
}

/** @type {import('./$types').LayoutServerLoad} */
export const load = async ({ locals }) => {
    const user = await locals.getUser();

    const emptyNavigation = {
        profile: null,
        isStaff: false,
        staffRole: null,
        unreadMessages: 0,
        pendingVerificationRequests: 0,
        pendingReports: 0,
        savedPriceDropAlerts: 0
    };

    if (!user) return { user, ...emptyNavigation };

    const start = performance.now();

    try {
        const { data, error } = await locals.supabase.rpc('get_navigation_data');
        if (error) throw error;

        const isValid = data !== null && typeof data === 'object' && !Array.isArray(data) &&
            (data.profile === null || (data.profile && typeof data.profile === 'object' && !Array.isArray(data.profile))) &&
            typeof data.isStaff === 'boolean' &&
            (data.staffRole === null || typeof data.staffRole === 'string') &&
            [
                data.unreadMessages,
                data.pendingVerificationRequests,
                data.pendingReports,
                data.savedPriceDropAlerts
            ].every((value) => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0);

        if (!isValid) throw new Error('Unexpected navigation RPC response shape');

        console.info('CAMPUSMART_NAVIGATION_RPC', {
            durationMs: Math.round(performance.now() - start),
            fallback: false
        });

        return {
            user,
            profile: data.profile,
            isStaff: data.isStaff,
            staffRole: data.staffRole,
            unreadMessages: data.unreadMessages,
            pendingVerificationRequests: data.pendingVerificationRequests,
            pendingReports: data.pendingReports,
            savedPriceDropAlerts: data.savedPriceDropAlerts
        };
    } catch (error) {
        console.error('Navigation RPC failed; using original queries:', error);
        const navigation = await loadLegacyNavigation(locals.supabase, user.id);
        console.info('CAMPUSMART_NAVIGATION_RPC', {
            durationMs: Math.round(performance.now() - start),
            fallback: true
        });
        return { user, ...navigation };
    }
};
