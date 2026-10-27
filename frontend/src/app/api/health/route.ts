import { handleGetHealth } from '@/lib/server-backend';

export async function GET() {
  return handleGetHealth();
}
