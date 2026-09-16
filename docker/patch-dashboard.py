#!/usr/bin/env python3
import subprocess
import sys

CONTAINER_BIN = "/opt/homebrew/bin/container"

def patch_dashboard():
    try:
        out = subprocess.check_output([CONTAINER_BIN, "exec", "ntms-dashboard", "cat", "/app/dashboard/index-DiewMw74.js"])
        content = out.decode("utf-8")
    except Exception as e:
        print(f"⚠️ Could not read dashboard bundle: {e}")
        return

    if "localStorage.clear();sessionStorage.clear()" in content:
        print("✅ Dashboard logout already patched.")
        return

    old_mU = "async function mU(){return await navigator.credentials.get({password:!0})!==null}"
    new_mU = "async function mU(){try{return await navigator.credentials?.get({password:!0})!==null}catch{return!1}}"

    old_V = 'V=async()=>{const J=S(window.location.origin,Rn()),Y=await d({input:JSON.stringify({returnTo:J})}),W=await mU();Tp&&W&&navigator.credentials.preventSilentAccess();const Q=Y?.errors||[],X=Y?JSON.parse(Y.data?.externalLogout?.logoutData||"null")?.logoutUrl:"";Q.length||(X?window.location.href=X:u("/"))}'
    new_V = 'V=async()=>{try{localStorage.clear();sessionStorage.clear();const J=S(window.location.origin,Rn()),Y=await d({input:JSON.stringify({returnTo:J})});try{const W=await mU();Tp&&W&&navigator.credentials?.preventSilentAccess()}catch{}window.location.href="/"}catch{localStorage.clear();window.location.href="/"}}'

    if old_mU in content and old_V in content:
        patched = content.replace(old_mU, new_mU).replace(old_V, new_V)
        patch_file = "/tmp/patched_dashboard_index.js"
        with open(patch_file, "w") as f:
            f.write(patched)
        subprocess.check_call([CONTAINER_BIN, "cp", patch_file, "ntms-dashboard:/app/dashboard/index-DiewMw74.js"])
        print("✅ Successfully patched dashboard logout in container.")
    else:
        print("⚠️ Dashboard code signatures did not match for patch.")

if __name__ == "__main__":
    patch_dashboard()
