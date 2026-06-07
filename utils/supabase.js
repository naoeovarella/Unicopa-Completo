import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_KEY

let supabaseClient

export function isSupabaseConfigurado() {
  return Boolean(supabaseUrl && supabaseKey)
}

function validarConfiguracaoSupabase() {
  const variaveisAusentes = []

  if (!supabaseUrl) {
    variaveisAusentes.push('EXPO_PUBLIC_SUPABASE_URL')
  }

  if (!supabaseKey) {
    variaveisAusentes.push('EXPO_PUBLIC_SUPABASE_ANON_KEY')
  }

  if (variaveisAusentes.length > 0) {
    throw new Error(
      `Configuração do Supabase ausente. Defina ${variaveisAusentes.join(
        ' e '
      )} no arquivo .env.local e reinicie o Expo.`
    )
  }
}

export function getSupabaseClient() {
  validarConfiguracaoSupabase()

  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  }

  return supabaseClient
}
