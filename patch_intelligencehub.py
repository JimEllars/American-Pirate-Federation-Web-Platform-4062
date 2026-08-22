import re

filepath = 'src/pages/IntelligenceHub.jsx'
with open(filepath, 'r') as f:
    content = f.read()

# Add import
import_stmt = "import TransmissionModal from '../components/ui/TransmissionModal';\n"
if 'TransmissionModal' not in content:
    content = content.replace("import Layout from '../components/Layout';", import_stmt + "import Layout from '../components/Layout';")

# Add state
if 'const [activePost, setActivePost]' not in content:
    state_stmt = "  const [activePost, setActivePost] = useState(null);\n"
    content = content.replace("const { data: posts, loading, error } = usePirateIntel();", "const { data: posts, loading, error } = usePirateIntel();\n" + state_stmt)

# Add Modal component
modal_stmt = """      <TransmissionModal
        isOpen={!!activePost}
        onClose={() => setActivePost(null)}
        post={activePost}
      />"""

if '<TransmissionModal' not in content:
    content = content.replace("    </Layout>", "      " + modal_stmt + "\n    </Layout>")

# Update Read Decrypt button
content = content.replace('<button className="mt-auto w-fit text-sm font-mono text-apf-purple hover:text-white flex items-center gap-2 uppercase tracking-widest">', '<button onClick={() => setActivePost(post)} className="mt-auto w-fit text-sm font-mono text-apf-purple hover:text-white flex items-center gap-2 uppercase tracking-widest">')


with open(filepath, 'w') as f:
    f.write(content)
