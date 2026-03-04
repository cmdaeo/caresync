// src/features/dashboard/pages/SecuritySettings.tsx
// Expanded Settings page — Profile, Appearance, Security, Danger Zone.
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Key,
  AlertTriangle,
  Loader2,
  ArrowRight,
  HeartPulse,
  HeartHandshake,
  User as UserIcon,
  Sun,
  Moon,
  Monitor,
  Palette,
} from 'lucide-react'
import { client } from '../../../shared/api/client'
import { useAuthStore } from '../../../shared/store/authStore'
import { useTheme } from '../../../context/ThemeContext'

/* ------------------------------------------------------------------ */
/*  Shared helpers                                                     */
/* ------------------------------------------------------------------ */

const inputCls =
  'w-full px-3.5 py-2.5 text-sm rounded-lg bg-bg-page border border-border-subtle text-text-main focus:ring-2 focus:ring-brand-primary outline-none'
const labelCls = 'block text-xs font-medium text-text-main mb-1.5 ml-1'

type ThemeOption = 'light' | 'dark' | 'system'

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export const SecuritySettings = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { theme, setTheme } = useTheme()

  /* ---- Profile state ---- */
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
  })
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileSuccess, setProfileSuccess] = useState(false)

  /* ---- Password state ---- */
  const [passData, setPassData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [passLoading, setPassLoading] = useState(false)
  const [passError, setPassError] = useState<string | null>(null)
  const [passSuccess, setPassSuccess] = useState(false)

  /* ---- Role state ---- */
  const [roleData, setRoleData] = useState({ currentPassword: '' })
  const [roleLoading, setRoleLoading] = useState(false)
  const [roleError, setRoleError] = useState<string | null>(null)

  const oppositeRole = user?.role === 'patient' ? 'caregiver' : 'patient'

  /* ---- Profile handler ---- */
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileLoading(true)
    setProfileError(null)
    setProfileSuccess(false)
    try {
      const res = await client.put('/auth/profile', {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
      })
      const updatedUser = res.data?.data?.user
      if (updatedUser) {
        // Shallow-merge into Zustand keeping token & role intact
        useAuthStore.setState({
          user: {
            ...user!,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
          },
        })
      }
      setProfileSuccess(true)
    } catch (err: any) {
      const responseData = err.response?.data
      if (responseData?.errors && Array.isArray(responseData.errors)) {
        setProfileError(responseData.errors.map((e: any) => e.msg).join('\n'))
      } else {
        setProfileError(responseData?.message || 'Failed to update profile')
      }
    } finally {
      setProfileLoading(false)
    }
  }

  /* ---- Password handler ---- */
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPassLoading(true)
    setPassError(null)
    setPassSuccess(false)

    if (passData.newPassword !== passData.confirmPassword) {
      setPassError("New passwords don't match")
      setPassLoading(false)
      return
    }

    try {
      await client.put('/auth/password', {
        currentPassword: passData.currentPassword,
        newPassword: passData.newPassword,
      })
      setPassSuccess(true)
      setPassData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err: any) {
      const responseData = err.response?.data
      if (responseData?.errors && Array.isArray(responseData.errors)) {
        setPassError(responseData.errors.map((e: any) => e.msg).join('\n'))
      } else {
        setPassError(responseData?.message || 'Failed to change password')
      }
    } finally {
      setPassLoading(false)
    }
  }

  /* ---- Role handler ---- */
  const handleRoleChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (
      !window.confirm(
        `WARNING: Changing to ${oppositeRole} will permanently delete ALL your current data. This cannot be undone. Are you absolutely sure?`
      )
    )
      return

    setRoleLoading(true)
    setRoleError(null)

    try {
      await client.put('/auth/role', {
        newRole: oppositeRole,
        currentPassword: roleData.currentPassword,
      })
      logout()
      navigate('/login', { replace: true })
    } catch (err: any) {
      setRoleError(err.response?.data?.message || 'Failed to change role')
      setRoleLoading(false)
    }
  }

  /* ---- Theme options ---- */
  const themeOptions: { value: ThemeOption; label: string; icon: React.ReactNode }[] = [
    { value: 'light', label: 'Light', icon: <Sun size={16} /> },
    { value: 'dark', label: 'Dark', icon: <Moon size={16} /> },
    { value: 'system', label: 'System', icon: <Monitor size={16} /> },
  ]

  /* ================================================================ */
  /*  JSX                                                              */
  /* ================================================================ */

  return (
    <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-text-main">Settings</h1>
        <p className="text-sm text-text-muted mt-1">Manage your profile, appearance, and account security.</p>
      </div>

      {/* ============================================================ */}
      {/*  1. Profile Section                                           */}
      {/* ============================================================ */}
      <div className="bg-bg-card border border-border-subtle rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-border-subtle bg-bg-page/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-primary/10 rounded-lg text-brand-primary">
              <UserIcon size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-main">Profile</h2>
              <p className="text-xs sm:text-sm text-text-muted">Update your personal information.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleProfileUpdate} className="p-5 sm:p-6 space-y-4">
          {profileError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-500 whitespace-pre-line">
              {profileError}
            </div>
          )}
          {profileSuccess && (
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-sm text-green-500 font-medium">
              Profile updated successfully!
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>First Name</label>
              <input
                type="text"
                value={profileData.firstName}
                onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Last Name</label>
              <input
                type="text"
                value={profileData.lastName}
                onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                className={inputCls}
              />
            </div>
          </div>

          {/* Email — read-only (backend doesn't support email change via profile) */}
          <div>
            <label className={labelCls}>Email</label>
            <input
              type="email"
              value={user?.email ?? ''}
              disabled
              className={inputCls + ' opacity-60 cursor-not-allowed'}
            />
            <p className="text-[11px] text-text-muted mt-1 ml-1">Email cannot be changed.</p>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={profileLoading}
              className="px-5 py-2.5 bg-brand-primary hover:bg-brand-light text-white text-sm font-bold rounded-lg transition-colors flex items-center disabled:opacity-50"
            >
              {profileLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
              Save Profile
            </button>
          </div>
        </form>
      </div>

      {/* ============================================================ */}
      {/*  2. Appearance Section                                        */}
      {/* ============================================================ */}
      <div className="bg-bg-card border border-border-subtle rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-border-subtle bg-bg-page/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
              <Palette size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-main">Appearance</h2>
              <p className="text-xs sm:text-sm text-text-muted">Choose your preferred colour scheme.</p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap gap-3">
            {themeOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                className={[
                  'flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all',
                  theme === opt.value
                    ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                    : 'border-border-subtle bg-bg-page text-text-muted hover:bg-bg-hover hover:text-text-main',
                ].join(' ')}
              >
                {opt.icon}
                {opt.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-text-muted mt-3 ml-1">
            {theme === 'system'
              ? 'Following your operating system preference.'
              : `Using ${theme} mode.`}
          </p>
        </div>
      </div>

      {/* ============================================================ */}
      {/*  3. Change Password                                           */}
      {/* ============================================================ */}
      <div className="bg-bg-card border border-border-subtle rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-border-subtle bg-bg-page/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
              <Key size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-main">Change Password</h2>
              <p className="text-xs sm:text-sm text-text-muted">Update your password to keep your account secure.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handlePasswordChange} className="p-5 sm:p-6 space-y-4">
          {passError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-500 whitespace-pre-line">
              {passError}
            </div>
          )}
          {passSuccess && (
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-sm text-green-500 font-medium">
              Password updated successfully!
            </div>
          )}

          <div>
            <label className={labelCls}>Current Password</label>
            <input
              type="password"
              required
              value={passData.currentPassword}
              onChange={(e) => setPassData({ ...passData, currentPassword: e.target.value })}
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>New Password</label>
              <input
                type="password"
                required
                value={passData.newPassword}
                onChange={(e) => setPassData({ ...passData, newPassword: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Confirm New Password</label>
              <input
                type="password"
                required
                value={passData.confirmPassword}
                onChange={(e) => setPassData({ ...passData, confirmPassword: e.target.value })}
                className={inputCls}
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={passLoading}
              className="px-5 py-2.5 bg-brand-primary hover:bg-brand-light text-white text-sm font-bold rounded-lg transition-colors flex items-center disabled:opacity-50"
            >
              {passLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
              Save Password
            </button>
          </div>
        </form>
      </div>

      {/* ============================================================ */}
      {/*  4. Danger Zone — Change Role                                 */}
      {/* ============================================================ */}
      <div className="bg-bg-card border border-red-500/30 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-red-500/20 bg-red-500/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg text-red-500">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-red-500">Danger Zone: Change Role</h2>
              <p className="text-xs sm:text-sm text-red-500/80 mt-0.5">
                Switching your account from <b>{user?.role}</b> to <b>{oppositeRole}</b> will permanently delete all your
                data.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleRoleChange} className="p-5 sm:p-6 space-y-4">
          {roleError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-500 whitespace-pre-line">
              {roleError}
            </div>
          )}

          <div className="p-4 bg-bg-page border border-border-subtle rounded-xl flex flex-col sm:flex-row items-center gap-4 sm:justify-between">
            <div className="flex items-center gap-4 text-sm font-medium text-text-muted">
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-card rounded-md border border-border-subtle">
                {user?.role === 'patient' ? (
                  <HeartPulse size={16} className="text-blue-500" />
                ) : (
                  <HeartHandshake size={16} className="text-purple-500" />
                )}
                {user?.role === 'patient' ? 'Patient' : 'Caregiver'}
              </span>
              <ArrowRight size={16} />
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary/10 text-brand-primary rounded-md border border-brand-primary/20">
                {oppositeRole === 'patient' ? <HeartPulse size={16} /> : <HeartHandshake size={16} />}
                {oppositeRole === 'patient' ? 'Patient' : 'Caregiver'}
              </span>
            </div>
          </div>

          <div>
            <label className={labelCls}>Confirm with current password to proceed</label>
            <input
              type="password"
              required
              placeholder="Enter password to confirm data wipe"
              value={roleData.currentPassword}
              onChange={(e) => setRoleData({ currentPassword: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm rounded-lg bg-bg-page border border-red-500/30 text-text-main focus:ring-2 focus:ring-red-500 outline-none placeholder-text-muted/60"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={roleLoading || !roleData.currentPassword}
              className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded-lg transition-colors flex items-center disabled:opacity-50"
            >
              {roleLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
              Wipe Data & Switch Role
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
