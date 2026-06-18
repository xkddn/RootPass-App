import { spawn } from 'node:child_process'
import { getDomain } from 'tldts'

export const isAutofillSupported = process.platform === 'win32'

const PS_BIN = 'powershell.exe'
const PS_ARGS = ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-EncodedCommand']
const PS_TIMEOUT_MS = 6000

function encodeCommand(script) {
  return Buffer.from(script, 'utf16le').toString('base64')
}

function runPowershell(script, stdinData = null) {
  return new Promise((resolve) => {
    let child
    try {
      child = spawn(PS_BIN, [...PS_ARGS, encodeCommand(script)], { windowsHide: true })
    } catch {
      resolve({ error: 'spawn_failed' })
      return
    }

    let out = ''
    let err = ''
    const timer = setTimeout(() => {
      try {
        child.kill()
      } catch {
        void 0
      }
      resolve({ error: 'timeout' })
    }, PS_TIMEOUT_MS)

    child.stdout.on('data', (d) => (out += d.toString('utf8')))
    child.stderr.on('data', (d) => (err += d.toString('utf8')))
    child.on('error', () => {
      clearTimeout(timer)
      resolve({ error: 'spawn_failed' })
    })
    child.on('close', () => {
      clearTimeout(timer)
      resolve({ out, err })
    })

    if (stdinData != null) {
      try {
        child.stdin.write(Buffer.from(stdinData, 'utf8'))
      } catch {
        void 0
      }
    }
    try {
      child.stdin.end()
    } catch {
      void 0
    }
  })
}

const READ_SCRIPT = `
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class Fg {
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern int GetWindowThreadProcessId(IntPtr hWnd, out int pid);
}
"@
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes
function Out-Json($o){ $o | ConvertTo-Json -Compress }
$browsers = 'chrome','msedge','firefox','brave','opera','vivaldi','arc'
$hwnd = [Fg]::GetForegroundWindow()
if ($hwnd -eq [IntPtr]::Zero) { Out-Json @{ ok=$false; reason='no_window' }; exit 0 }
$procId = 0
[void][Fg]::GetWindowThreadProcessId($hwnd, [ref]$procId)
$proc = $null
try { $proc = Get-Process -Id $procId -ErrorAction Stop } catch {}
if (-not $proc) { Out-Json @{ ok=$false; reason='no_process' }; exit 0 }
if ($browsers -notcontains $proc.ProcessName) { Out-Json @{ ok=$false; reason='not_browser'; browser=$proc.ProcessName }; exit 0 }
$root = [System.Windows.Automation.AutomationElement]::FromHandle($hwnd)
if ($root -eq $null) { Out-Json @{ ok=$false; reason='no_uia'; browser=$proc.ProcessName }; exit 0 }
$cond = New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ControlTypeProperty, [System.Windows.Automation.ControlType]::Edit)
$url = $null
for ($i=0; $i -lt 4; $i++) {
  try {
    $edit = $root.FindFirst([System.Windows.Automation.TreeScope]::Descendants, $cond)
    if ($edit -ne $null) { $url = $edit.GetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern).Current.Value }
    break
  } catch { Start-Sleep -Milliseconds 120 }
}
if ([string]::IsNullOrWhiteSpace($url)) { Out-Json @{ ok=$false; reason='no_url'; browser=$proc.ProcessName }; exit 0 }
Out-Json @{ ok=$true; browser=$proc.ProcessName; hwnd=[int64]$hwnd; url=$url }
`

const TYPE_SCRIPT = `
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class Inject {
  [StructLayout(LayoutKind.Sequential)] public struct INPUT { public uint type; public KEYBDINPUT ki; public int p1; public int p2; }
  [StructLayout(LayoutKind.Sequential)] public struct KEYBDINPUT { public ushort wVk; public ushort wScan; public uint dwFlags; public uint time; public IntPtr dwExtra; }
  [DllImport("user32.dll")] public static extern uint SendInput(uint n, INPUT[] inputs, int size);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
  const uint KB = 1, UNI = 0x0004, KEYUP = 0x0002;
  static INPUT CD(char c){ INPUT i=new INPUT(); i.type=KB; i.ki.wScan=c; i.ki.dwFlags=UNI; return i; }
  static INPUT CU(char c){ INPUT i=new INPUT(); i.type=KB; i.ki.wScan=c; i.ki.dwFlags=UNI|KEYUP; return i; }
  static INPUT VD(ushort vk){ INPUT i=new INPUT(); i.type=KB; i.ki.wVk=vk; return i; }
  static INPUT VU(ushort vk){ INPUT i=new INPUT(); i.type=KB; i.ki.wVk=vk; i.ki.dwFlags=KEYUP; return i; }
  static void Send(INPUT[] a){ if(a.Length>0) SendInput((uint)a.Length, a, Marshal.SizeOf(typeof(INPUT))); }
  public static void Focus(IntPtr h){ SetForegroundWindow(h); }
  public static void ReleaseModifiers(){ Send(new INPUT[]{ VU(0x11), VU(0x10), VU(0x12), VU(0x5B), VU(0x5C) }); }
  public static void TypeText(string t){ var l=new System.Collections.Generic.List<INPUT>(); foreach(char c in t){ l.Add(CD(c)); l.Add(CU(c)); } Send(l.ToArray()); }
  public static void PressVk(ushort vk){ Send(new INPUT[]{ VD(vk), VU(vk) }); }
}
"@
[Console]::InputEncoding = [System.Text.Encoding]::UTF8
$raw = [Console]::In.ReadToEnd()
$o = $raw | ConvertFrom-Json
$h = [IntPtr][int64]$o.hwnd
if ($h -ne [IntPtr]::Zero) { [Inject]::Focus($h); Start-Sleep -Milliseconds 120 }
[Inject]::ReleaseModifiers()
Start-Sleep -Milliseconds 60
$hasLogin = -not [string]::IsNullOrEmpty($o.login)
$hasPass = -not [string]::IsNullOrEmpty($o.password)
if ($hasLogin) { [Inject]::TypeText($o.login) }
if ($hasLogin -and $hasPass) { Start-Sleep -Milliseconds 70; [Inject]::PressVk(0x09) }
if ($hasPass) { Start-Sleep -Milliseconds 70; [Inject]::TypeText($o.password) }
if ($o.submit) { Start-Sleep -Milliseconds 90; [Inject]::PressVk(0x0D) }
Write-Output 'ok'
`

const FOREGROUND_SCRIPT = `
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class Fgw {
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern int GetWindowThreadProcessId(IntPtr hWnd, out int pid);
}
"@
$h = [Fgw]::GetForegroundWindow()
$procId = 0
[void][Fgw]::GetWindowThreadProcessId($h, [ref]$procId)
$name = ''
try { $name = (Get-Process -Id $procId -ErrorAction Stop).ProcessName } catch {}
@{ hwnd=[int64]$h; process=$name } | ConvertTo-Json -Compress
`

export async function getForegroundWindow() {
  if (!isAutofillSupported) return null
  const res = await runPowershell(FOREGROUND_SCRIPT)
  if (res.error) return null
  try {
    return JSON.parse(res.out.trim())
  } catch {
    return null
  }
}

export async function readActiveBrowserUrl() {
  if (!isAutofillSupported) return { ok: false, reason: 'unsupported' }
  const res = await runPowershell(READ_SCRIPT)
  if (res.error) return { ok: false, reason: res.error }
  try {
    return JSON.parse(res.out.trim())
  } catch {
    return { ok: false, reason: 'parse_error' }
  }
}

const SCAN_SCRIPT = `
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes
function Out-Json($o){ $o | ConvertTo-Json -Compress }
$browsers = 'chrome','msedge','firefox','brave','vivaldi','arc'
$procs = Get-Process | Where-Object { $browsers -contains $_.ProcessName -and $_.MainWindowHandle -ne 0 }
$cond = New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ControlTypeProperty, [System.Windows.Automation.ControlType]::Edit)
foreach ($p in $procs) {
  try {
    $root = [System.Windows.Automation.AutomationElement]::FromHandle($p.MainWindowHandle)
    if ($root -eq $null) { continue }
    $edit = $root.FindFirst([System.Windows.Automation.TreeScope]::Descendants, $cond)
    if ($edit -ne $null) {
      $url = $edit.GetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern).Current.Value
      if (-not [string]::IsNullOrWhiteSpace($url)) { Out-Json @{ ok=$true; url=$url }; exit 0 }
    }
  } catch {}
}
Out-Json @{ ok=$false }
`

export async function readAnyBrowserUrl() {
  if (!isAutofillSupported) return { ok: false }
  const res = await runPowershell(SCAN_SCRIPT)
  if (res.error) return { ok: false }
  try {
    return JSON.parse(res.out.trim())
  } catch {
    return { ok: false }
  }
}

export async function typeCredentials({ hwnd = 0, login = '', password = '', submit = false }) {
  if (!isAutofillSupported) return { ok: false, reason: 'unsupported' }
  const payload = JSON.stringify({ hwnd, login, password, submit })
  const res = await runPowershell(TYPE_SCRIPT, payload)
  if (res.error) return { ok: false, reason: res.error }
  return { ok: res.out.includes('ok') }
}

export function extractDomain(rawUrl) {
  if (!rawUrl) return null
  let u = String(rawUrl).trim()
  if (!u) return null
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(u)) u = 'http://' + u
  try {
    const host = new URL(u).hostname.toLowerCase()
    return host.replace(/^www\./, '') || null
  } catch {
    return null
  }
}

function baseDomain(host) {
  if (!host) return null
  const registrable = getDomain(host)
  if (registrable) return registrable
  const parts = host.split('.').filter(Boolean)
  if (parts.length <= 2) return host
  return parts.slice(-2).join('.')
}

export function domainMatches(accountUrl, browsedDomain) {
  const a = baseDomain(extractDomain(accountUrl))
  const b = baseDomain(browsedDomain)
  return !!a && !!b && a === b
}
