import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { services } from "@/services/registry";
import {
  AdminProfileHeader,
  AdminProfileSection,
  AdminProfileTable,
  AdminProfileLoading,
  AdminProfileError,
  AdminProfileEmptyState,
} from "@/components/admin/profile";
import { useAdminUsers } from "@/services/hooks";

export const Route = createFileRoute("/admin/profile")({
  component: AdminProfilePage,
});

function AdminProfilePage() {
  const { data: usersData } = useAdminUsers();
  const users = (usersData ?? []) as unknown as Record<string, any>[];
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredUsers = users.filter((user) => {
    if (!searchQuery) return true;
    const searchable = `${user.full_name} ${user.email} ${user.id}`.toLowerCase();
    return searchable.includes(searchQuery.toLowerCase());
  });

  const handleUserSelect = async (userId: string) => {
    setSelectedUserId(userId);
    setLoading(true);
    setError(null);
    try {
      // User details (user info + historical data sections)
      const userDetails = await services.admin.getUserDetails({ user_id: userId });

      // Session-grouped behavior for the login-session history; fail soft so
      // the rest of the profile still renders if it's temporarily unavailable.
      let sessionData: any = { auth_sessions: [] };
      try {
        sessionData = await services.admin.getUserSessions({ user_id: userId });
      } catch (sessionErr: any) {
        console.warn("Failed to load session history:", sessionErr);
      }

      setUserData({
        ...userDetails,
        auth_sessions_with_behavioral: sessionData?.auth_sessions ?? [],
      });
    } catch (err: any) {
      setError(err.message || "Failed to load user data");
      setUserData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    // Reset selection when search changes
    if (selectedUserId) {
      const stillExists = filteredUsers.some((u) => u.id === selectedUserId);
      if (!stillExists) {
        setSelectedUserId(null);
        setUserData(null);
      }
    }
  };

  const handleExport = async () => {
    if (selectedUserId) {
      // Use the existing admin service export method
      await services.admin.exportTrainingDataByUsers({ user_id: selectedUserId });
    }
  };

  if (loading && !userData) {
    return <AdminProfileLoading />;
  }

  if (error) {
    return <AdminProfileError message={error} />;
  }

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-mono">
            Admin · Profile
          </div>
          <h1 className="text-2xl font-semibold tracking-tight mt-1">User Profile</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Complete historical data for selected user
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="rounded-xl border border-emerald-400/40 bg-emerald-400/10 hover:bg-emerald-400/20 px-3 py-2 text-xs font-semibold inline-flex items-center gap-1.5 text-emerald-200"
            disabled={!selectedUserId || loading}
            title="Download this user's complete dataset (ZIP of CSV files)"
            onClick={handleExport}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-3.5"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export User Data (.zip)
          </button>
        </div>
      </header>

      {/* User selection */}
      <div className="flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-1.5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-3.5 text-muted-foreground"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search users by name, email, or ID..."
              className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground/60"
            />
          </div>
        </div>
        <div className="shrink-0">
          <button
            className={`px-3 py-2 rounded-lg transition-colors ${
              selectedUserId ? "bg-white/[0.06] text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setSelectedUserId(null)}
          >
            Clear Selection
          </button>
        </div>
      </div>

      {/* Users list */}
      <div className="border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="bg-white/[0.02] px-4 py-3 text-xs font-mono text-muted-foreground border-b border-white/[0.06]">
          Select a user to view their complete historical data
        </div>
        <div className="max-h-96 overflow-y-auto">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className={`flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] cursor-pointer border-b border-white/[0.06] ${
                selectedUserId === user.id ? "bg-white/[0.06]" : ""
              }`}
              onClick={() => handleUserSelect(user.id)}
            >
              <div className="size-10 rounded-full bg-gradient-to-br from-blue-400/30 to-cyan-400/30 border border-white/10 flex items-center justify-center text-[11px] font-mono">
                {user.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{user.full_name || user.name || "Unknown"}</div>
                <div className="text-[11px] text-muted-foreground font-mono truncate">
                  {user.email}
                </div>
                <div className="text-[10px] font-mono text-muted-foreground">{user.id}</div>
              </div>
              <div className="text-xs font-mono text-muted-foreground">
                {user.roles && user.roles.includes("admin") ? "admin" : "user"}
              </div>
            </div>
          ))}
          {filteredUsers.length === 0 && (
            <div className="px-4 py-6 text-center text-xs text-muted-foreground">
              No users found matching "{searchQuery}"
            </div>
          )}
        </div>
      </div>

      {/* Compact user profile summary (replaces the detailed sections) */}
      {selectedUserId && userData && (
        <div className="border border-white/[0.06] rounded-xl overflow-hidden">
          {/* User header */}
          <div className="border-b border-white/[0.06] px-4 py-3">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-full bg-gradient-to-br from-blue-400/30 to-cyan-400/30 border border-white/10 flex items-center justify-center text-[16px] font-mono">
                {userData.user
                  ? userData.user.full_name
                    ? userData.user.full_name
                      .split(" ")
                      .map((part: string) => part[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()
                    : "??"
                  : "??"}
              </div>
              <div>
                <div className="text-base font-semibold">{userData.user?.full_name || userData.user?.email || "Unknown User"}</div>
                <div className="text-[11px] font-mono text-muted-foreground">
                  {userData.user?.email} · {userData.user?.id}
                </div>
                <div className="mt-2 flex flex-wrap gap-3">
                  {(userData.user?.roles ?? []).map((role: string) => (
                    <span
                      key={role}
                      className={`px-2 py-0.5 rounded text-[9px] font-mono ${
                        role === "admin"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-white/[0.06]"
                      }`}
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* User stats summary */}
          <div className="px-4 py-4 space-y-4">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Summary
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm font-mono">
              <div>
                <div className="text-[10px] text-muted-foreground">Training Sessions</div>
                <div className="font-medium">{userData.training_sessions?.length ?? 0}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground">Training Events</div>
                <div className="font-medium">{userData.training_events?.length ?? 0}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground">Training Features</div>
                <div className="font-medium">{userData.training_features?.length ?? 0}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground">Behavioral Events</div>
                <div className="font-medium">{userData.behavioral_events?.length ?? 0}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground">Behavior Windows</div>
                <div className="font-medium">{userData.behavior_windows?.length ?? 0}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground">Auth Sessions</div>
                <div className="font-medium">{userData.auth_sessions?.length ?? 0}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground">Device Profiles</div>
                <div className="font-medium">{userData.device_profiles?.length ?? 0}</div>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Note: Export filters out empty/meaningless records for clean datasets
            </p>
          </div>

          {/* Download button */}
          <div className="px-4 py-4">
            <button
              className="w-full rounded-xl border border-emerald-400/40 bg-emerald-400/10 hover:bg-emerald-400/20 px-4 py-3 text-xs font-semibold inline-flex items-center justify-center gap-2 text-emerald-200"
              disabled={loading}
              onClick={handleExport}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-4"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download Dataset (CSV)
            </button>
          </div>

          {/* Detailed data sections */}
          <div className="space-y-6 px-4 pb-4">
            {/* Training Sessions */}
            {(userData.training_sessions?.length ?? 0) > 0 && (
              <AdminProfileSection title="Training Sessions">
                <AdminProfileTable
                  columns={[
                    { key: "session_id", label: "Session ID" },
                    { key: "task_type", label: "Task Type" },
                    { key: "status", label: "Status" },
                    { key: "started_at", label: "Started" },
                    { key: "completed_at", label: "Completed" },
                    { key: "sample_count", label: "Samples" },
                    { key: "device_id", label: "Device" },
                  ]}
                  rows={userData.training_sessions.map((s: any) => ({
                    session_id: s.session_id?.slice(0, 12) + "...",
                    task_type: s.task_type,
                    status: s.status,
                    started_at: s.started_at,
                    completed_at: s.completed_at || "—",
                    sample_count: s.sample_count,
                    device_id: s.device_id || "—",
                  }))}
                />
              </AdminProfileSection>
            )}

            {/* Training Events */}
            {(userData.training_events?.length ?? 0) > 0 && (
              <AdminProfileSection title={`Training Events (${userData.training_events.length})`}>
                <AdminProfileTable
                  columns={[
                    { key: "id", label: "Event ID" },
                    { key: "session_id", label: "Session" },
                    { key: "task_type", label: "Task" },
                    { key: "event_type", label: "Event" },
                    { key: "timestamp", label: "Time" },
                    { key: "key_code", label: "Key" },
                    { key: "dwell_time_ms", label: "Dwell (ms)" },
                    { key: "flight_time_ms", label: "Flight (ms)" },
                    { key: "x", label: "X" },
                    { key: "y", label: "Y" },
                  ]}
                  rows={userData.training_events.slice(0, 50).map((e: any) => ({
                    id: e.id?.slice(0, 12) + "...",
                    session_id: e.session_id?.slice(0, 12) + "...",
                    task_type: e.task_type,
                    event_type: e.event_type,
                    timestamp: e.timestamp,
                    key_code: e.key_code ? String.fromCharCode(e.key_code) : "—",
                    dwell_time_ms: typeof e.dwell_time_ms === "number" ? e.dwell_time_ms.toFixed(1) : "—",
                    flight_time_ms: typeof e.flight_time_ms === "number" ? e.flight_time_ms.toFixed(1) : "—",
                    x: typeof e.x === "number" ? e.x.toFixed(1) : "—",
                    y: typeof e.y === "number" ? e.y.toFixed(1) : "—",
                  }))}
                />
                {userData.training_events.length > 50 && (
                  <div className="px-4 py-2 text-[10px] text-muted-foreground">
                    Showing first 50 of {userData.training_events.length} events
                  </div>
                )}
              </AdminProfileSection>
            )}

            {/* Training Features */}
            {(userData.training_features?.length ?? 0) > 0 && (
              <AdminProfileSection title="Training Features">
                <AdminProfileTable
                  columns={[
                    { key: "id", label: "Feature ID" },
                    { key: "session_id", label: "Session" },
                    { key: "task_type", label: "Task" },
                    { key: "typing_speed", label: "Typing Speed" },
                    { key: "mean_key_hold", label: "Mean Key Hold" },
                    { key: "std_key_hold", label: "Std Key Hold" },
                    { key: "mean_flight_time", label: "Mean Flight" },
                    { key: "std_flight_time", label: "Std Flight" },
                    { key: "created_at", label: "Created" },
                  ]}
                  rows={userData.training_features.map((f: any) => ({
                    id: f.id?.slice(0, 12) + "...",
                    session_id: f.session_id?.slice(0, 12) + "...",
                    task_type: f.task_type,
                    typing_speed: typeof f.typing_speed === "number" ? f.typing_speed.toFixed(2) : "—",
                    mean_key_hold: typeof f.mean_key_hold === "number" ? f.mean_key_hold.toFixed(1) : "—",
                    std_key_hold: typeof f.std_key_hold === "number" ? f.std_key_hold.toFixed(1) : "—",
                    mean_flight_time: typeof f.mean_flight_time === "number" ? f.mean_flight_time.toFixed(1) : "—",
                    std_flight_time: typeof f.std_flight_time === "number" ? f.std_flight_time.toFixed(1) : "—",
                    created_at: f.created_at,
                  }))}
                />
              </AdminProfileSection>
            )}

            {/* Behavioral Events */}
            {(userData.behavioral_events?.length ?? 0) > 0 && (
              <AdminProfileSection title={`Behavioral Events (${userData.behavioral_events.length})`}>
                <AdminProfileTable
                  columns={[
                    { key: "id", label: "Event ID" },
                    { key: "session_id", label: "Session" },
                    { key: "event_type", label: "Event Type" },
                    { key: "timestamp", label: "Time" },
                    { key: "key_code", label: "Key" },
                    { key: "dwell_time_ms", label: "Dwell" },
                    { key: "flight_time_ms", label: "Flight" },
                    { key: "x", label: "X" },
                    { key: "y", label: "Y" },
                    { key: "velocity", label: "Velocity" },
                  ]}
                  rows={userData.behavioral_events.slice(0, 50).map((e: any) => ({
                    id: e.id?.slice(0, 12) + "...",
                    session_id: e.session_id?.slice(0, 12) + "...",
                    event_type: e.event_type,
                    timestamp: e.timestamp,
                    key_code: e.key_code ? String.fromCharCode(e.key_code) : "—",
                    dwell_time_ms: typeof e.dwell_time_ms === "number" ? e.dwell_time_ms.toFixed(1) : "—",
                    flight_time_ms: typeof e.flight_time_ms === "number" ? e.flight_time_ms.toFixed(1) : "—",
                    x: typeof e.x === "number" ? e.x.toFixed(1) : "—",
                    y: typeof e.y === "number" ? e.y.toFixed(1) : "—",
                    velocity: typeof e.velocity === "number" ? e.velocity.toFixed(1) : "—",
                  }))}
                />
                {userData.behavioral_events.length > 50 && (
                  <div className="px-4 py-2 text-[10px] text-muted-foreground">
                    Showing first 50 of {userData.behavioral_events.length} events
                  </div>
                )}
              </AdminProfileSection>
            )}

            {/* Behavior Windows */}
            {(userData.behavior_windows?.length ?? 0) > 0 && (
              <AdminProfileSection title="Behavior Windows">
                <AdminProfileTable
                  columns={[
                    { key: "id", label: "Window ID" },
                    { key: "session_id", label: "Session" },
                    { key: "window_start", label: "Start" },
                    { key: "window_end", label: "End" },
                    { key: "dwellMeanMs", label: "Dwell Mean" },
                    { key: "flightMeanMs", label: "Flight Mean" },
                    { key: "keysPerSec", label: "Keys/Sec" },
                    { key: "clickCount", label: "Clicks" },
                    { key: "mouseTravelPx", label: "Mouse Travel" },
                  ]}
                  rows={userData.behavior_windows.slice(0, 50).map((w: any) => ({
                    id: w.id?.slice(0, 12) + "...",
                    session_id: w.session_id?.slice(0, 12) + "...",
                    window_start: w.window_start,
                    window_end: w.window_end,
                    dwellMeanMs: w.features?.dwellMeanMs ? w.features.dwellMeanMs.toFixed(1) : "—",
                    flightMeanMs: w.features?.flightMeanMs ? w.features.flightMeanMs.toFixed(1) : "—",
                    keysPerSec: w.features?.keysPerSec ? w.features.keysPerSec.toFixed(2) : "—",
                    clickCount: w.features?.clickCount ?? "—",
                    mouseTravelPx: w.features?.mouseTravelPx ? w.features.mouseTravelPx.toFixed(0) : "—",
                  }))}
                />
                {userData.behavior_windows.length > 50 && (
                  <div className="px-4 py-2 text-[10px] text-muted-foreground">
                    Showing first 50 of {userData.behavior_windows.length} windows
                  </div>
                )}
              </AdminProfileSection>
            )}

            {/* Auth Sessions */}
            {(userData.auth_sessions?.length ?? 0) > 0 && (
              <AdminProfileSection title="Auth Sessions">
                <AdminProfileTable
                  columns={[
                    { key: "id", label: "Session ID" },
                    { key: "device_id", label: "Device" },
                    { key: "ip_address", label: "IP" },
                    { key: "created_at", label: "Created" },
                    { key: "last_active_at", label: "Last Active" },
                    { key: "revoked", label: "Revoked" },
                    { key: "logged_out_at", label: "Logged Out" },
                    { key: "behavioral_events", label: "Beh. Events" },
                    { key: "behavior_windows", label: "Beh. Windows" },
                  ]}
                  rows={userData.auth_sessions.map((s: any) => ({
                    id: s.id?.slice(0, 12) + "...",
                    device_id: s.device_id || "—",
                    ip_address: s.ip_address || "—",
                    created_at: s.created_at,
                    last_active_at: s.last_active_at,
                    revoked: s.revoked ? "Yes" : "No",
                    logged_out_at: s.logged_out_at || "—",
                    behavioral_events: s.behavioral_events?.length ?? 0,
                    behavior_windows: s.behavior_windows?.length ?? 0,
                  }))}
                />
              </AdminProfileSection>
            )}

            {/* Device Profiles */}
            {(userData.device_profiles?.length ?? 0) > 0 && (
              <AdminProfileSection title="Device Profiles">
                <AdminProfileTable
                  columns={[
                    { key: "id", label: "Profile ID" },
                    { key: "fingerprint", label: "Fingerprint" },
                    { key: "label", label: "Label" },
                    { key: "kind", label: "Kind" },
                    { key: "os", label: "OS" },
                    { key: "browser", label: "Browser" },
                    { key: "trust", label: "Trust" },
                    { key: "last_active", label: "Last Active" },
                  ]}
                  rows={userData.device_profiles.map((d: any) => ({
                    id: d.id?.slice(0, 12) + "...",
                    fingerprint: d.fingerprint?.slice(0, 20) + "...",
                    label: d.label || "—",
                    kind: d.kind || "—",
                    os: d.os || "—",
                    browser: d.browser || "—",
                    trust: d.trust || "—",
                    last_active: d.last_active || "—",
                  }))}
                />
              </AdminProfileSection>
            )}
          </div>
        </div>
      )}

      {/* Placeholder when no user selected */}
      {!selectedUserId && (
        <div className="text-center py-12 text-muted-foreground">
          <p>Select a user from the list above to view their complete historical data</p>
          <p className="mt-2 text-xs">
            Data includes authentication sessions, training data, continuous behavioral monitoring, and device profiles
          </p>
        </div>
      )}
    </div>
  );
}