import { supabase } from './supabaseClient';

export async function getCourseData(courseId) {
    const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();
        
    if (error) {
        console.error('Error fetching course data:', error);
        return null;
    }
    return data?.data;
}

export async function getProfessorData(name) {
    const { data, error } = await supabase
        .from('professors')
        .select('*')
        .eq('id', name)
        .single();
        
    if (error) {
        console.error('Error fetching professor data:', error);
        return null;
    }
    return data?.data;
}

export async function searchCourses(query) {
    if (!query) return [];
    // Basic search on course ID containing the query
    const { data, error } = await supabase
        .from('courses')
        .select('id')
        .ilike('id', `%${query}%`)
        .limit(10);
        
    if (error) {
        console.error('Error searching courses:', error);
        return [];
    }
    return data;
}

export async function getMajorRequirements(majorId) {
    const { data, error } = await supabase
        .from('majors')
        .select('*')
        .eq('id', majorId)
        .single();
        
    if (error) {
        console.error('Error fetching major requirements:', error);
        return null;
    }
    return data;
}
