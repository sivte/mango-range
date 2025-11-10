import { ThumbProps } from "./types";
import styles from "./Thumb.module.css";

/**
 * Thumb component renders a draggable slider handle
 * Supports 2D movement (both X and Y)
 */
export const Thumb: React.FC<ThumbProps> = ({
  ref,
  id,
  percentageX,
  percentageY,
  isDragging,
  onMouseDown,
  onTouchStart,
}) => {
  const thumbStyle = {
    left: `${percentageX}%`,
    top: `${percentageY}%`,
  };

  return (
    <button
      ref={ref}
      type="button"
      id={id}
      className={`${styles.handle} ${isDragging ? styles.dragging : ""}`}
      style={thumbStyle}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      data-testid={`${id}-handle`}
    />
  );
};
