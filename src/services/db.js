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
    
    // Format the query to handle missing spaces (e.g., 'math11' -> 'math%11')
    // and multiple spaces (e.g., 'math   11' -> 'math%11')
    const formattedQuery = query
        .replace(/\s+/g, '%') // Replace any spaces with wildcard
        .replace(/([a-zA-Z])(\d)/g, '$1%$2') // Add wildcard between letter and number
        .replace(/(\d)([a-zA-Z])/g, '$1%$2'); // Add wildcard between number and letter

    // Basic search on course ID containing the formatted query
    const { data, error } = await supabase
        .from('courses')
        .select('id')
        .ilike('id', `%${formattedQuery}%`)
        .limit(10);
        
    if (error) {
        console.error('Error searching courses:', error);
        return [];
    }
    return data;
}

export async function getAllMajorsOptions() {
    const { data, error } = await supabase
        .from('majors')
        .select('id, name')
        .order('name');
        
    if (error) {
        console.error('Error fetching all major options:', error);
        return [];
    }
    return data.map(major => ({ value: major.id, label: major.name }));
}

export async function getAllMajors() {
    const { data, error } = await supabase
        .from('majors')
        .select('*');
        
    if (error) {
        console.error('Error fetching all majors:', error);
        return [];
    }
    return data;
}

export async function saveMajor(majorId, majorData) {
    const { data, error } = await supabase
        .from('majors')
        .upsert({ id: majorId, ...majorData })
        .select();
        
    if (error) {
        console.error('Error saving major:', error);
        return null;
    }
    return data;
}

export async function deleteMajor(majorId) {
    const { data, error } = await supabase
        .from('majors')
        .delete()
        .eq('id', majorId)
        .select();
        
    if (error) {
        console.error('Error deleting major:', error);
        return null;
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

export async function getAllMinorsOptions() {
    const { data, error } = await supabase
        .from('minors')
        .select('id, name')
        .order('name');
        
    if (error) {
        console.error('Error fetching all minor options:', error);
        return [];
    }
    return data.map(minor => ({ value: minor.id, label: minor.name }));
}

export async function getAllMinors() {
    const { data, error } = await supabase
        .from('minors')
        .select('*');
        
    if (error) {
        console.error('Error fetching all minors:', error);
        return [];
    }
    return data;
}

export async function saveMinor(minorId, minorData) {
    const { data, error } = await supabase
        .from('minors')
        .upsert({ id: minorId, ...minorData })
        .select();
        
    if (error) {
        console.error('Error saving minor:', error);
        return null;
    }
    return data;
}

export async function deleteMinor(minorId) {
    const { data, error } = await supabase
        .from('minors')
        .delete()
        .eq('id', minorId)
        .select();
        
    if (error) {
        console.error('Error deleting minor:', error);
        return null;
    }
    return data;
}

export async function getMinorRequirements(minorId) {
    const { data, error } = await supabase
        .from('minors')
        .select('*')
        .eq('id', minorId)
        .single();
        
    if (error) {
        console.error('Error fetching minor requirements:', error);
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

export async function deleteUserAccount(userId) {
    // Delete user courses
    const { error: coursesError } = await supabase
        .from('user_courses')
        .delete()
        .eq('user_id', userId);
        
    if (coursesError) {
        console.error('Error deleting user courses:', coursesError);
        return false;
    }

    // Delete user profile
    const { error: profileError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', userId);
        
    if (profileError) {
        console.error('Error deleting user profile:', profileError);
        return false;
    }
    
    return true;
}
