import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// GET - Fetch all halls
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const is_active = searchParams.get('is_active');

    let query = supabase
      .from('halls')
      .select('*')
      .order('name', { ascending: true });

    // Apply filters
    if (is_active !== null) {
      query = query.eq('is_active', is_active === 'true');
    }

    const { data: halls, error } = await query;

    if (error) {
      console.error('Error fetching halls:', error);
      return NextResponse.json(
        { success: false, message: 'Error fetching halls' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: halls
    });

  } catch (error) {
    console.error('Error in GET /api/halls:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
