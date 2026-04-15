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

export async function getUserProfile(userId) {
    const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();
    if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user profile:', error);
    }
    return data;
}

export async function saveUserProfile(userId, profileData) {
    const { data, error } = await supabase
        .from('user_profiles')
        .upsert({ id: userId, ...profileData })
        .select();
    if (error) {
        console.error('Error saving user profile:', error);
        return null;
    }
    return data;
}

export async function getUserCourses(userId) {
    const { data, error } = await supabase
        .from('user_courses')
        .select('*')
        .eq('user_id', userId);
    if (error) {
        console.error('Error fetching user courses:', error);
        return [];
    }
    return data;
}

export async function saveUserCourse(courseData) {
    const { data, error } = await supabase
        .from('user_courses')
        .insert(courseData)
        .select();
    if (error) {
        console.error('Error saving user course:', error);
        return null;
    }
    return data;
}

export async function updateUserCourse(courseRecordId, updates) {
    const { data, error } = await supabase
        .from('user_courses')
        .update(updates)
        .eq('id', courseRecordId)
        .select();
    if (error) {
        console.error('Error updating user course:', error);
        return null;
    }
    return data;
}

export async function deleteUserCourse(courseRecordId) {
    const { data, error } = await supabase
        .from('user_courses')
        .delete()
        .eq('id', courseRecordId)
        .select();
    if (error) {
        console.error('Error deleting user course:', error);
        return null;
    }
    return data;
}
