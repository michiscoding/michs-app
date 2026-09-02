export async function onRequest(context) {
  const { request, env } = context;
  const user = env.SITE_USER;
  const pass = env.SITE_PASSWORD;

  if (!user || !pass) {
    return new Response('Site auth not configured', { status: 500 });
  }

  const auth = request.headers.get('Authorization');
  if (auth && auth.startsWith('Basic ')) {
    const decoded = atob(auth.slice(6));
    const sep = decoded.indexOf(':');
    const u = decoded.slice(0, sep);
    const p = decoded.slice(sep + 1);
    if (u === user && p === pass) {
      return context.next();
    }
  }

  return new Response('Authentication required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="michs"' }
  });
}
