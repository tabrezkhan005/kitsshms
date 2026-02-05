import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // First, delete all existing halls
    const { error: deleteError } = await supabase
      .from('halls')
      .delete()
      .gte('id', '0'); // Delete all records

    if (deleteError) {
      console.error('Error deleting existing halls:', deleteError);
      return NextResponse.json({ error: 'Failed to delete existing halls' }, { status: 500 });
    }

    // Insert the 5 specific KITS seminar halls
    const hallsData = [
      {
        id: '1',
        name: 'Dr Abdul Kalam',
        capacity: 200,
        description: 'Main auditorium named after Dr APJ Abdul Kalam',
        location: 'Main Building, Ground Floor',
        amenities: ['Projector', 'Sound System', 'Air Conditioning', 'Podium'],
        is_active: true
      },
      {
        id: '2',
        name: 'CV Raman',
        capacity: 400,
        description: 'Large hall named after Nobel laureate CV Raman',
        location: 'Science Block, First Floor',
        amenities: ['Projector', 'Sound System', 'Air Conditioning', 'Podium'],
        is_active: true
      },
      {
        id: '3',
        name: 'Chaguveera',
        capacity: 80,
        description: 'Intimate hall for smaller events and discussions',
        location: 'Student Center, Ground Floor',
        amenities: ['Projector', 'Sound System', 'Air Conditioning'],
        is_active: true
      },
      {
        id: '4',
        name: 'Newton Hall',
        capacity: 200,
        description: 'Medium-sized hall named after Sir Isaac Newton',
        location: 'Science Block, Second Floor',
        amenities: ['Projector', 'Whiteboard', 'Air Conditioning'],
        is_active: true
      },
      {
        id: '5',
        name: 'R & D',
        capacity: 150,
        description: 'Research and development hall with specialized equipment',
        location: 'R&D Block, Third Floor',
        amenities: ['Projector', 'Lab Equipment', 'Air Conditioning'],
        is_active: true
      }
    ];

    const { data: insertedHalls, error: insertError } = await supabase
      .from('halls')
      .insert(hallsData)
      .select();

    if (insertError) {
      console.error('Error inserting halls:', insertError);
      return NextResponse.json({ error: 'Failed to insert halls' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Halls updated successfully with the 5 KITS halls',
      data: insertedHalls
    });

  } catch (error) {
    console.error('Error in setup halls API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
