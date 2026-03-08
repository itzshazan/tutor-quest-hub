import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { address } = await req.json();
    if (!address || typeof address !== 'string') {
      return new Response(JSON.stringify({ error: 'address is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use OpenStreetMap Nominatim API (free, no API key needed)
    const encoded = encodeURIComponent(address);
    const url = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1&addressdetails=1`;

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'TutorQuest/1.0',
        'Accept-Language': 'en',
      },
    });

    if (!res.ok) {
      throw new Error(`Nominatim returned ${res.status}`);
    }

    const data = await res.json();

    if (!data || data.length === 0) {
      return new Response(JSON.stringify({ error: 'Location not found', lat: null, lng: null, city: null, formatted_address: null }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result = data[0];
    const addr = result.address || {};
    const city = addr.city || addr.town || addr.village || addr.county || addr.state || '';
    
    return new Response(JSON.stringify({
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      city,
      formatted_address: result.display_name,
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
