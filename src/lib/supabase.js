import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://fsbjabtudjzqisvugiez.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_19Ev5VjCK933TvpeSSbf0w_Pb4AkkWI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function getDailyLog(date) {
  const { data, error } = await supabase.from('daily_log').select('*').eq('date', date).single();
  if (error && error.code !== 'PGRST116') console.error(error);
  return data;
}

export async function upsertDailyLog(date, updates) {
  const { data, error } = await supabase.from('daily_log').upsert({ date, ...updates, updated_at: new Date().toISOString() }, { onConflict: 'date' }).select().single();
  if (error) console.error(error);
  return data;
}

export async function getAllDailyLogs() {
  const { data, error } = await supabase.from('daily_log').select('*').order('date', { ascending: true });
  if (error) console.error(error);
  return data || [];
}

export async function getTaskCompletions(date) {
  const { data, error } = await supabase.from('task_completions').select('*').eq('date', date);
  if (error) console.error(error);
  return data || [];
}

export async function toggleTaskCompletion(date, taskIndex, completed) {
  const { data, error } = await supabase.from('task_completions').upsert({ date, task_index: taskIndex, completed }, { onConflict: 'date,task_index' }).select().single();
  if (error) console.error(error);
  return data;
}

export async function delayTask(date, taskIndex, delayedTo) {
  const { data, error } = await supabase.from('task_completions').upsert({ date, task_index: taskIndex, completed: false, delayed_to: delayedTo }, { onConflict: 'date,task_index' }).select().single();
  if (error) console.error(error);
  return data;
}

export async function getNBMEScores() {
  const { data, error } = await supabase.from('nbme_scores').select('*').order('date_taken', { ascending: true });
  if (error) console.error(error);
  return data || [];
}

export async function addNBMEScore(examName, dateTaken, score, percentile, notes) {
  const { data, error } = await supabase.from('nbme_scores').insert({ exam_name: examName, date_taken: dateTaken, score, percentile, notes }).select().single();
  if (error) console.error(error);
  return data;
}

export async function logPomodoro(date, durationMinutes, systemFocus) {
  const { data, error } = await supabase.from('pomodoro_sessions').insert({ date, started_at: new Date().toISOString(), duration_minutes: durationMinutes, completed: true, system_focus: systemFocus }).select().single();
  if (error) console.error(error);
  return data;
}

export async function getPomodorosForDate(date) {
  const { data, error } = await supabase.from('pomodoro_sessions').select('*').eq('date', date).eq('completed', true);
  if (error) console.error(error);
  return data || [];
}

export async function getAllPomodoros() {
  const { data, error } = await supabase.from('pomodoro_sessions').select('*').eq('completed', true).order('date', { ascending: true });
  if (error) console.error(error);
  return data || [];
}
