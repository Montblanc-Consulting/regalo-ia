/* Configuración pública del registro (Supabase).
   La "anon key" es PÚBLICA por diseño: puede ir en el repo sin problema,
   porque la política RLS "insert sí, select no" impide leer datos.
   NUNCA pongas aquí la "service_role key" (la secreta). */

window.SUPABASE_URL      = "https://ajgxemgjlzoycfaxifjj.supabase.co";
window.SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqZ3hlbWdqbHpveWNmYXhpZmpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1MjQ0NDAsImV4cCI6MjEwODEwMDQ0MH0.mfzLNaRD_bt2vaj3nsMb20snL_AZsuTEINrtX3Wy5MY";
