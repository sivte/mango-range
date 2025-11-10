interface BadgeProps {
  children: React.ReactNode;
  className?: string;
}

export function Badge({ children, className = "" }: BadgeProps) {
  return (
    <span
      className={`text-[11px] sm:text-[13px] py-1 px-2 sm:px-3 rounded-xl font-medium whitespace-nowrap ${className}`}
      style={{
        color: "var(--text-primary)",
        background: "var(--badge-bg)",
      }}
    >
      {children}
    </span>
  );
}
