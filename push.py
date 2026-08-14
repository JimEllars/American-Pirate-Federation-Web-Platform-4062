import subprocess
try:
    subprocess.run(["git", "push", "-u", "origin", "feature/phase-86-runtime-shield-csp"], check=True)
except Exception as e:
    print(e)
