import { NextRequest, NextResponse } from 'next/server';
import { updateUserProfile } from '../../../../server/index';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clerkId, data } = body;
    
    if (!clerkId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const result = await updateUserProfile(clerkId, data);
    
    return NextResponse.json({ success: true, user: result }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update profile' },
      { status: 500 }
    );
  }
} 