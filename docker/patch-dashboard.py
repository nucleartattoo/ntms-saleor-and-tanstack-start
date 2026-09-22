#!/usr/bin/env python3
import subprocess
import sys
import re

CONTAINER_BIN = "/opt/homebrew/bin/container"

def get_entry_bundle_filename():
    try:
        html = subprocess.check_output([CONTAINER_BIN, "exec", "ntms-dashboard", "cat", "/app/dashboard/index.html"]).decode("utf-8")
        match = re.search(r'src="/dashboard/(index-[a-zA-Z0-9_-]+\.js)"', html)
        if match:
            return match.group(1)
    except Exception as e:
        print(f"⚠️ Could not read dashboard index.html: {e}")
    return None

def patch_dashboard():
    bundle_name = get_entry_bundle_filename()
    if not bundle_name:
        print("⚠️ Could not determine dashboard entry bundle filename.")
        return

    bundle_path = f"/app/dashboard/{bundle_name}"
    try:
        out = subprocess.check_output([CONTAINER_BIN, "exec", "ntms-dashboard", "cat", bundle_path])
        content = out.decode("utf-8")
    except Exception as e:
        print(f"⚠️ Could not read dashboard bundle ({bundle_path}): {e}")
        return

    if "localStorage.clear();sessionStorage.clear()" in content:
        print(f"✅ Dashboard logout already patched in {bundle_name}.")
        return

    # 1. Patch navigator.credentials.get helper: async function Zx(){return await navigator.credentials.get({password:!0})!==null}
    fn_match = re.search(r'async function ([a-zA-Z0-9_]+)\(\)\{return await navigator\.credentials\.get\(\{password:!0\}\)!==null\}', content)
    fn_name = fn_match.group(1) if fn_match else None

    # 2. Patch logout function containing preventSilentAccess
    logout_match = re.search(
        r'([a-zA-Z0-9_]+=async\(\)=>\{const [a-zA-Z0-9_]+=S\(window\.location\.origin,[a-zA-Z0-9_]+\(\)\),[a-zA-Z0-9_]+=await [a-zA-Z0-9_]+\(\{input:JSON\.stringify\(\{returnTo:[a-zA-Z0-9_]+\}\)\}\),.*?navigator\.credentials\.preventSilentAccess\(\);.*?\})',
        content
    )

    if fn_match and logout_match:
        old_fn = fn_match.group(0)
        new_fn = f"async function {fn_name}(){{try{{return await navigator.credentials?.get({{password:!0}})!==null}}catch{{return!1}}}}"
        old_logout = logout_match.group(1)
        var_name = old_logout.split("=")[0]
        new_logout = f'{var_name}=async()=>{{try{{localStorage.clear();sessionStorage.clear();window.location.href="/"}}catch{{localStorage.clear();window.location.href="/"}}}}'

        patched = content.replace(old_fn, new_fn).replace(old_logout, new_logout)
        patch_file = f"/tmp/patched_{bundle_name}"
        with open(patch_file, "w") as f:
            f.write(patched)
        subprocess.check_call([CONTAINER_BIN, "cp", patch_file, f"ntms-dashboard:{bundle_path}"])
        print(f"✅ Successfully patched dashboard logout in container ({bundle_name}).")
    else:
        print(f"⚠️ Dashboard code signatures did not match for patch in {bundle_name}.")

if __name__ == "__main__":
    patch_dashboard()
