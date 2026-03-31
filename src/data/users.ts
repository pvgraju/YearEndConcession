// Credentials stored server-side in production. This is for demo only.
const USERS: Record<string, string> = {
  admin: "admin@123",
  raju: "raju@123",
  "sridhar@srichaitanya.net": "$ridh@r",
};

export function authenticate(username: string, password: string): boolean {
  const u = username.trim().toLowerCase();
  return USERS[u] === password;
}
