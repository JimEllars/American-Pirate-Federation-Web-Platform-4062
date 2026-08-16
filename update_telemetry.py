import re

with open("src/lib/api/telemetry.js", "r") as f:
    content = f.read()

# Determine the telemetry endpoint based on environment
telemetry_url_logic = """
const isMockEnv = !import.meta.env.VITE_SUPABASE_URL ||
                  import.meta.env.VITE_SUPABASE_URL.includes('mock.supabase.co') ||
                  import.meta.env.VITE_SUPABASE_URL.includes('localhost');

const TELEMETRY_ENDPOINT = isMockEnv ? '/api/telemetry' : `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/telemetry-ingress`;
"""

content = content.replace("const QUEUE_KEY = 'apf_telemetry_queue';", "const QUEUE_KEY = 'apf_telemetry_queue';\n" + telemetry_url_logic)

content = content.replace("'https://mock.supabase.co/functions/v1/telemetry-ingress'", "TELEMETRY_ENDPOINT")

with open("src/lib/api/telemetry.js", "w") as f:
    f.write(content)
