import { getSecuritySummary } from '@/lib/security/spear';

export async function GET() {
  const summary = getSecuritySummary();

  return Response.json(summary);
}
