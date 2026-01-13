// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://grlayjybcxrcaufnwysb.supabase.co'; 
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdybGF5anliY3hyY2F1Zm53eXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzNDM4NzksImV4cCI6MjA4MDkxOTg3OX0.Voj60xKccEl2_r8EzLVO-fot5WiEiUHb6UTfya2ql8Q'; 

export const supabase = createClient(supabaseUrl, supabaseAnonKey);