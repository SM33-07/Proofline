import { NextRequest, NextResponse } from 'next/server';
import { revocationRegistry } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  // Ensure registry is synchronized with persistent disk state
  revocationRegistry.reload();

  const jti = request.nextUrl.searchParams.get('jti');
  const userId = request.nextUrl.searchParams.get('userId');
  const versionStr = request.nextUrl.searchParams.get('version');
  const tokenVersion = versionStr ? parseInt(versionStr, 10) : 1;

  let isRevoked = false;
  if (jti && revocationRegistry.isRevoked(jti)) {
    isRevoked = true;
  }

  if (userId) {
    const currentVer = revocationRegistry.getUserVersion(userId);
    if (tokenVersion < currentVer) {
      isRevoked = true;
    }
  }

  return NextResponse.json(
    { revoked: isRevoked },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );
}
