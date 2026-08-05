import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

/* ─── Waitlist ─── */
export async function addToWaitlist(toolId, email) {
  const { error } = await supabase
    .from('waitlist')
    .insert({ tool_id: toolId, email });

  if (!error) return { success: true };
  if (error.code === '23505') return { duplicate: true };
  return { error: error.message };
}

/* ─── Courses ─── */
export async function getCourses() {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('published', true)
    .order('order_index', { ascending: true });

  if (error) throw error;
  return data;
}

export async function getAllCourses() {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .order('order_index', { ascending: true });

  if (error) throw error;
  return data;
}

export async function createCourse(course) {
  const { data, error } = await supabase
    .from('courses')
    .insert(course)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCourse(id, updates) {
  const { data, error } = await supabase
    .from('courses')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCourse(id) {
  const { error } = await supabase
    .from('courses')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
