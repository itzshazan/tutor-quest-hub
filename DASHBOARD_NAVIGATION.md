# 🎯 Supabase Dashboard Navigation Guide

## Where to Add Secrets

### Visual Path

```
Supabase Dashboard
  └─ Your Project (aiuufmhfmjubvkedwhci)
      └─ ⚙️ Project Settings (gear icon in left sidebar)
          └─ Edge Functions
              └─ Secrets section
                  └─ [Add secret] button
```

### Direct Links

| Task | Link |
|------|------|
| Add secrets | https://supabase.com/dashboard/project/aiuufmhfmjubvkedwhci/settings/functions |
| View Edge Function logs | https://supabase.com/dashboard/project/aiuufmhfmjubvkedwhci/functions/send-session-notification/logs |
| Deploy Edge Functions | https://supabase.com/dashboard/project/aiuufmhfmjubvkedwhci/functions |
| Database tables | https://supabase.com/dashboard/project/aiuufmhfmjubvkedwhci/editor |
| SQL Editor | https://supabase.com/dashboard/project/aiuufmhfmjubvkedwhci/sql/new |

## What You'll See

### 1. Project Settings → Edge Functions

```
┌─────────────────────────────────────────────────────┐
│ Edge Functions                                      │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Secrets                                             │
│ ┌─────────────────────────────────────────────┐   │
│ │ Name                    Value               │   │
│ ├─────────────────────────────────────────────┤   │
│ │ STRIPE_SECRET_KEY       sk_test_...         │   │
│ │ STRIPE_WEBHOOK_SECRET   whsec_...           │   │
│ │                                             │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│ [+ Add secret]                                      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

Click **[+ Add secret]** and enter:
- Name: `RESEND_API_KEY`
- Value: `re_JeosjnCz_3oup79Wv4U19Cce5c1s43iPy`

### 2. Edge Functions → send-session-notification → Logs

```
┌─────────────────────────────────────────────────────┐
│ send-session-notification                           │
├─────────────────────────────────────────────────────┤
│ [Details] [Logs] [Metrics] [Deploy]                │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Logs                                                │
│ ┌─────────────────────────────────────────────┐   │
│ │ 2026-04-26 18:13:53                         │   │
│ │ RESEND_API_KEY found: re_Jeosj...           │   │
│ │                                             │   │
│ │ 2026-04-26 18:13:54                         │   │
│ │ Email API response: {                       │   │
│ │   status: 200,                              │   │
│ │   ok: true,                                 │   │
│ │   data: { id: "..." }                       │   │
│ │ }                                           │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

Look for:
- ✅ "RESEND_API_KEY found" → Secret is configured
- ✅ "status: 200, ok: true" → Email sent successfully
- ❌ "RESEND_API_KEY is not configured" → Secret missing
- ❌ "status: 403" or "status: 401" → API key issue

## Left Sidebar Navigation

```
┌─────────────────────────┐
│ 🏠 Home                 │
│ 📊 Table Editor         │
│ 🔍 SQL Editor           │
│ 🗄️ Database             │
│ 🔐 Authentication       │
│ 📦 Storage              │
│ ⚡ Edge Functions       │ ← Click here to see functions
│ 📈 Logs                 │
│ ⚙️ Project Settings     │ ← Click here to add secrets
└─────────────────────────┘
```

## Step-by-Step with Screenshots

### Step 1: Open Project Settings
1. Click the **⚙️ gear icon** in the left sidebar
2. Or click **Project Settings** at the bottom of the sidebar

### Step 2: Navigate to Edge Functions
1. In the settings menu, click **Edge Functions**
2. You'll see a list of your Edge Functions and a **Secrets** section below

### Step 3: Add Secret
1. Scroll to the **Secrets** section
2. Click **[+ Add secret]** or **[New secret]**
3. A form will appear with two fields:
   - **Name**: Enter `RESEND_API_KEY`
   - **Value**: Enter `re_JeosjnCz_3oup79Wv4U19Cce5c1s43iPy`
4. Click **Add** or **Save**

### Step 4: Verify
1. The secret should now appear in the list
2. You'll see: `RESEND_API_KEY` with value `re_Jeosj...` (masked)
3. Edge Functions will automatically restart (no action needed)

## Common UI Elements

| Element | What It Does |
|---------|--------------|
| **⚙️ Project Settings** | Access project configuration |
| **Edge Functions** (in settings) | Manage secrets and function settings |
| **⚡ Edge Functions** (in sidebar) | View, deploy, and monitor functions |
| **Logs** tab | View function execution logs |
| **Deploy** button | Deploy new function version |
| **[+ Add secret]** | Add a new environment variable |

## Keyboard Shortcuts

- `Ctrl + K` (Windows) or `Cmd + K` (Mac) → Open command palette
- Type "Edge Functions" → Quick navigate to Edge Functions
- Type "Settings" → Quick navigate to Project Settings

## Mobile/Tablet

The Supabase Dashboard works on mobile browsers, but it's easier to use on desktop. If you're on mobile:
1. Use landscape mode for better visibility
2. Zoom in if text is too small
3. Use the hamburger menu (☰) to access the sidebar

## Troubleshooting Dashboard Issues

| Issue | Solution |
|-------|----------|
| Can't find Project Settings | Look for ⚙️ gear icon at bottom of left sidebar |
| Can't find Edge Functions in settings | Scroll down in the settings menu |
| Can't see Secrets section | Scroll down on the Edge Functions settings page |
| Changes not saving | Check for error messages, try refreshing the page |
| Can't access Dashboard | Verify you're logged in to Supabase |

## Alternative: Use Supabase CLI

If you prefer command line:

```bash
# Login to Supabase
supabase login

# Set the secret
supabase secrets set RESEND_API_KEY=re_JeosjnCz_3oup79Wv4U19Cce5c1s43iPy --project-ref aiuufmhfmjubvkedwhci

# List all secrets
supabase secrets list --project-ref aiuufmhfmjubvkedwhci
```

## Quick Reference Card

```
┌──────────────────────────────────────────────────┐
│ QUICK REFERENCE: Add RESEND_API_KEY             │
├──────────────────────────────────────────────────┤
│ 1. Go to: supabase.com/dashboard                │
│ 2. Select project: aiuufmhfmjubvkedwhci         │
│ 3. Click: ⚙️ Project Settings                    │
│ 4. Click: Edge Functions                        │
│ 5. Scroll to: Secrets section                   │
│ 6. Click: [+ Add secret]                        │
│ 7. Enter:                                        │
│    Name:  RESEND_API_KEY                        │
│    Value: re_JeosjnCz_3oup79Wv4U19Cce5c1s43iPy │
│ 8. Click: Save                                   │
│ 9. Done! ✅                                      │
└──────────────────────────────────────────────────┘
```

---

**Need help?** See `EMAIL_FIX_SUMMARY.md` for the complete guide.
