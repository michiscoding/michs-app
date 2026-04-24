const SUPABASE_URL = 'https://wtezfaxtpwjpqdmnmsny.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_rYRPB_AT_n9lwAcaMJkuDA_o7b_Zx1E';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function getAdminClient() {
    const { data: { session } } = await db.auth.getSession();
    if (session) return db;

    const email = prompt('email:');
    if (!email) return null;
    const password = prompt('password:');
    if (!password) return null;

    const { error } = await db.auth.signInWithPassword({ email, password });
    if (error) { alert('sign in failed: ' + error.message); return null; }
    return db;
}
