const SUPABASE_URL = 'https://wtezfaxtpwjpqdmnmsny.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_rYRPB_AT_n9lwAcaMJkuDA_o7b_Zx1E';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function getServiceKey() {
    let key = localStorage.getItem('sb_service_key');
    if (!key) {
        key = prompt('enter supabase service key:');
        if (key) localStorage.setItem('sb_service_key', key);
    }
    return key;
}

function getAdminClient() {
    const key = getServiceKey();
    if (!key) return null;
    return createClient(SUPABASE_URL, key);
}
