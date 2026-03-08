import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Fetch tutors with location but no coordinates
    const { data: tutors, error } = await supabase
      .from('tutor_profiles')
      .select('user_id, location')
      .is('latitude', null)
      .not('location', 'is', null)
      .not('location', 'eq', '');

    if (error) throw error;
    if (!tutors || tutors.length === 0) {
      return new Response(JSON.stringify({ message: 'No tutors to backfill', count: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let updated = 0;
    let failed = 0;

    for (const tutor of tutors) {
      try {
        // Rate limit: Nominatim requires max 1 request per second
        if (updated > 0) await new Promise(r => setTimeout(r, 1100));

        const encoded = encodeURIComponent(tutor.location + ', India');
        const url = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1&addressdetails=1`;

        const res = await fetch(url, {
          headers: { 'User-Agent': 'TutorQuest/1.0', 'Accept-Language': 'en' },
        });

        const data = await res.json();
        if (!data || data.length === 0) {
          failed++;
          continue;
        }

        const result = data[0];
        const addr = result.address || {};
        const city = addr.city || addr.town || addr.village || addr.county || addr.state || '';

        const { error: updateErr } = await supabase
          .from('tutor_profiles')
          .update({
            latitude: parseFloat(result.lat),
            longitude: parseFloat(result.lon),
            city,
          })
          .eq('user_id', tutor.user_id);

        if (updateErr) {
          failed++;
        } else {
          updated++;
        }
      } catch {
        failed++;
      }
    }

    return new Response(JSON.stringify({ 
      message: `Backfill complete`, 
      total: tutors.length, 
      updated, 
      failed 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
