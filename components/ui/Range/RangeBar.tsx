import { RangeBarProps } from "./types";
import styles from "./RangeBar.module.css";

/**
 * RangeBar component renders the slider track with active track
 * between min and max thumbs
 */
export const RangeBar: React.FC<RangeBarProps> = ({
  minPercentage,
  maxPercentage,
  orientation = "horizontal",
}) => {
  const activeTrackStyle =
    orientation === "horizontal"
      ? {
          left: `${minPercentage}%`,
          width: `${maxPercentage - minPercentage}%`,
        }
      : {
          bottom: `${minPercentage}%`,
          height: `${maxPercentage - minPercentage}%`,
        };

  return (
    <>
      <span
        className={`${styles.track} ${
          orientation === "vertical" ? styles.vertical : styles.horizontal
        }`}
      />
      <span
        className={`${styles.activeTrack} ${
          orientation === "vertical" ? styles.vertical : styles.horizontal
        }`}
        style={activeTrackStyle}
      />
    </>
  );
};
