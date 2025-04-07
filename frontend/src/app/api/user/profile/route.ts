import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const walletAddress = searchParams.get('walletAddress');
    
    if (!userId && !walletAddress) {
      return NextResponse.json(
        { error: 'Either userId or walletAddress is required' },
        { status: 400 }
      );
    }

    const sql = neon(process.env.DATABASE_URL!);
    let query;
    
    if (userId) {
      // Fetch by Clerk ID
      query = await sql`
        SELECT * FROM users 
        WHERE clerk_id = ${userId}
      `;
    } else {
      // Fetch by wallet address
      query = await sql`
        SELECT * FROM users 
        WHERE wallet_address = ${walletAddress}
      `;
    }
    
    if (query.length === 0) {
      return NextResponse.json(
        { success: true, profile: null, message: 'User profile not found' },
        { status: 200 }
      );
    }
    
    const profile = {
      id: query[0].id,
      clerkId: query[0].clerk_id,
      username: query[0].username || '',
      email: query[0].email,
      phone: query[0].phone || '',
      walletAddress: query[0].wallet_address || '',
      createdAt: query[0].created_at,
      updatedAt: query[0].updated_at
    };
    
    return NextResponse.json(
      { success: true, profile },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch profile' },
      { status: 500 }
    );
  }
} 