import re

filepath = 'src/components/sections/NewsFeed.jsx'
with open(filepath, 'r') as f:
    content = f.read()

# Add import
import_stmt = "import TransmissionModal from '../ui/TransmissionModal';\n"
if 'TransmissionModal' not in content:
    content = content.replace("import { useWPContent }", import_stmt + "import { useWPContent }")

# Add state
if 'const [activePost, setActivePost]' not in content:
    state_stmt = "  const [activePost, setActivePost] = React.useState(null);\n"
    content = content.replace("export function NewsFeed() {\n  const { data: posts, isLoading, error } = useWPContent();", "export function NewsFeed() {\n  const { data: posts, isLoading, error } = useWPContent();\n" + state_stmt)

# Add Modal component
modal_stmt = """      <TransmissionModal
        isOpen={!!activePost}
        onClose={() => setActivePost(null)}
        post={activePost}
      />"""

if '<TransmissionModal' not in content:
    content = content.replace("    </div>\n  );\n}", "      " + modal_stmt + "\n    </div>\n  );\n}")

# Update Read Decrypt button
content = content.replace('<button className="mt-4 text-sm font-vt323 uppercase tracking-widest text-apf-purpleLight hover:text-white flex items-center gap-2 self-start">', '<button onClick={() => setActivePost(post)} className="mt-4 text-sm font-vt323 uppercase tracking-widest text-apf-purpleLight hover:text-white flex items-center gap-2 self-start">')


with open(filepath, 'w') as f:
    f.write(content)
