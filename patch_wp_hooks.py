import re

def patch_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Replacement string
    replacement = r"""const rawWpUrl = import.meta.env.VITE_WP_API_URL || 'https://piratefederation.org/wp-json';
        const cleanBaseUrl = rawWpUrl.replace(/\/+$/, '');
        const requestUrl = `${cleanBaseUrl}/wp/v2/${endpoint}`;
        const response = await fetch(requestUrl);"""

    # Target search string
    target = r"const response = await fetch\(`https://intel\.piratefederation\.org/wp-json/wp/v2/\$\{endpoint\}`\);"

    new_content = re.sub(target, replacement.strip(), content)

    with open(filepath, 'w') as f:
        f.write(new_content)

patch_file('src/hooks/useWPContent.js')
patch_file('src/hooks/usePirateIntel.js')
