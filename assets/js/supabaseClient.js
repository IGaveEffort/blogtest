// assets/js/supabaseClient.js
// Fill these in from Supabase Project Settings → API
const SUPABASE_URL = "https://nsuufzmmjbwqkpqnhhbs.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zdXVmem1tamJ3cWtwcW5oaGJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3NTM5MjUsImV4cCI6MjA4MTMyOTkyNX0.K2Y0mBRQnQwJIQdH61mPuwexwqJGovlvbasuq5F6RO0";

// Expose a single shared client as window.supabaseClient
(function initSupabase() {
  if (!window.supabase || typeof window.supabase.createClient !== "function") {
    console.warn("Supabase CDN not loaded. Ensure <script src=\"https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2\"></script> is included before this file.");
    return;
  }
  window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
})();
