// assets/js/supabaseClient.js
// Fill these in from Supabase Project Settings → API
const SUPABASE_URL = "https://YOUR_PROJECT_ID.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_PUBLIC_ANON_KEY";

// Expose a single shared client as window.supabaseClient
(function initSupabase() {
  if (!window.supabase || typeof window.supabase.createClient !== "function") {
    console.warn("Supabase CDN not loaded. Ensure <script src=\"https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2\"></script> is included before this file.");
    return;
  }
  window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
})();
