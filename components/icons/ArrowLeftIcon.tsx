import React from "react";

interface ArrowLeftIconProps {
  width?: number;
  height?: number;
  className?: string;
}

export const ArrowLeftIcon: React.FC<ArrowLeftIconProps> = ({
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
    >
      <path
        fill="currentColor"
        d="M14 17.308L8.692 12L14 6.692l.708.708l-4.6 4.6l4.6 4.6z"
      />
    </svg>
  );
};
