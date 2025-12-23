// supabase.js
const supabaseUrl = "https://vsybixkkveuefyazaxqk.supabase.co/"; // Replace with your Project URL
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzeWJpeGtrdmV1ZWZ5YXpheHFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2ODE0MDksImV4cCI6MjA4MTI1NzQwOX0.dIZGnXulJhMN96ffow8ELWgzlx_XzbisdeqBd86W0EI";    // Replace with your API Key

// We use window.supabase because we are loading the library via CDN in the HTML
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

export { supabase };
