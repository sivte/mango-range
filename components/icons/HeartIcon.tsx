import React from "react";

interface HeartIconProps {
  width?: number;
  height?: number;
  className?: string;
}

export const HeartIcon: React.FC<HeartIconProps> = ({
  width = 24,
  height = 24,
  className,
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 24 24"
      className={className}
      style={{ display: "inline-block", verticalAlign: "text-bottom" }}
    >
      <path
        fill="currentColor"
        d="M9 2H5v2H3v2H1v6h2v2h2v2h2v2h2v2h2v2h2v-2h2v-2h2v-2h2v-2h2v-2h2V6h-2V4h-2V2h-4v2h-2v2h-2V4H9zm0 2v2h2v2h2V6h2V4h4v2h2v6h-2v2h-2v2h-2v2h-2v2h-2v-2H9v-2H7v-2H5v-2H3V6h2V4z"
      />
    </svg>
  );
};
