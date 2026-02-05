const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateHalls() {
  try {
    console.log('Starting hall update...');

    // First, delete all existing halls
    console.log('Deleting existing halls...');
    const { error: deleteError } = await supabase
      .from('halls')
      .delete()
      .gte('id', '0');

    if (deleteError) {
      console.error('Error deleting existing halls:', deleteError);
      return;
    }

    console.log('Existing halls deleted successfully');

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

    console.log('Inserting new halls...');
    const { data: insertedHalls, error: insertError } = await supabase
      .from('halls')
      .insert(hallsData)
      .select();

    if (insertError) {
      console.error('Error inserting halls:', insertError);
      return;
    }

    console.log('Halls updated successfully!');
    console.log('Inserted halls:', insertedHalls);

  } catch (error) {
    console.error('Error in updateHalls:', error);
  }
}

updateHalls();
