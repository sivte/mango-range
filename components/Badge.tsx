interface BadgeProps {
  children: React.ReactNode;
  className?: string;
}

export function Badge({ children, className = "" }: BadgeProps) {
  return (
    <span
      className={`text-[13px] py-1 px-3 rounded-xl font-medium ${className}`}
      style={{
        color: "var(--text-primary)",
        background: "var(--badge-bg)",
      }}
    >
      {children}
    </span>
  );
}
