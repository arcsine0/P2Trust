import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://bskmwkpycpwvossnbuel.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJza213a3B5Y3B3dm9zc25idWVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU4NzY5MTUsImV4cCI6MjA0MTQ1MjkxNX0.c7_HZxCaCrHwf4vMjF3i7BGqGYkRsRRq--2fe3xmMl8";

export const supabase = createClient(supabaseUrl, supabaseKey, {
	auth: {
		storage: AsyncStorage,
		autoRefreshToken: true,
		persistSession: true,
		detectSessionInUrl: false,
	},
})

export { supabase }