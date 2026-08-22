import re

filepath = 'src/components/web3/Web3ConnectButton.jsx'
with open(filepath, 'r') as f:
    content = f.read()

# Replacement string
replacement = 'const AXIM_CORE_TELEMETRY_URL = "/api/telemetry";'

# Target search string
target = r'const AXIM_CORE_TELEMETRY_URL = "https://pvbcdndqjguzqeafhwhw\.supabase\.co/functions/v1/satellite-telemetry";'

new_content = re.sub(target, replacement, content)

with open(filepath, 'w') as f:
    f.write(new_content)
