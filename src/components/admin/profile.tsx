/* eslint-disable @typescript-eslint/no-explicit-any */
export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  initials: string;
  roles: string[];
}

export const AdminProfileHeader = ({ user }: { user: any }) => {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <div className="border-b border-white/[0.06] pb-4 mb-6">
      <div className="flex items-center gap-4">
        <div className="size-14 rounded-full bg-gradient-to-br from-blue-400/30 to-cyan-400/30 border border-white/10 flex items-center justify-center text-[18px] font-mono">
          {getInitials(user.full_name || user.email || "??")}
        </div>
        <div>
          <div className="text-base font-semibold">{user.full_name || user.email}</div>
          <div className="text-[11px] font-mono text-muted-foreground">
            {user.id} · {user.email}
          </div>
          <div className="mt-2 flex flex-wrap gap-3">
            {user.roles?.map((role: string) => (
              <span
                key={role}
                className={`px-2 py-0.5 rounded text-[9px] font-mono ${
                  role === "admin" ? "bg-emerald-500/20 text-emerald-300" : "bg-white/[0.06]"
                }`}
              >
                {role}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const AdminProfileSection = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => {
  return (
    <div className="mb-6">
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        {title}
      </h2>
      <div className="border border-white/[0.06] rounded-xl overflow-hidden">{children}</div>
    </div>
  );
};

export const AdminProfileTable = ({
  columns,
  rows,
}: {
  columns: Array<{ key: string; label: string }>;
  rows: Array<Record<string, any>>;
}) => {
  if (rows.length === 0) {
    return (
      <div className="px-4 py-4 text-xs text-muted-foreground text-center">No records found</div>
    );
  }

  return (
    <div className="divide-y divide-white/[0.06]">
      <div className="bg-white/[0.02] px-4 py-3 text-xs font-mono text-muted-foreground">
        <div className="grid grid-cols-[repeat(var(--column-count, 10),minmax(0,1fr))]">
          {columns.map((col) => (
            <div key={col.key} className="{/* dynamic */}">
              {col.label}
            </div>
          ))}
        </div>
      </div>
      <div className="divide-y divide-white/[0.06]">
        {rows.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className={`px-4 py-3 ${rowIndex % 2 === 1 ? "bg-white/[0.01]" : ""}`}
          >
            <div className="grid grid-cols-[repeat(var(--column-count, 10),minmax(0,1fr))] text-xs font-mono">
              {columns.map((col) => (
                <div key={`${rowIndex}-${col.key}`}>{row[col.key]}</div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const AdminProfileLoading = () => {
  return (
    <div className="text-center py-12 text-muted-foreground">
      <div className="animate-pulse inline-block h-8 w-8 rounded-full bg-white/[0.2]" />
      <p className="mt-4">Loading user data...</p>
    </div>
  );
};

export const AdminProfileError = ({ message }: { message: string }) => {
  return (
    <div className="text-center py-12 text-[11px] text-muted-foreground">
      <p>Error loading user data:</p>
      <p className="mt-2 text-[rose-300]">{message}</p>
    </div>
  );
};

export const AdminProfileEmptyState = () => {
  return (
    <div className="text-center py-12 text-muted-foreground">
      <p>No data available for this user</p>
      <p className="mt-2 text-xs">
        The user may not have any recorded sessions, events, or device profiles yet.
      </p>
    </div>
  );
};
