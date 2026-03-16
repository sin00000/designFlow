interface StarEyeLogoProps {
  size?: number;
  className?: string;
}

export default function StarEyeLogo({ size = 28, className }: StarEyeLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Organic 5-pointed star with slightly curved, hand-drawn edges */}
      <path
        d="M 50 7
           Q 57 18 62 34
           Q 80 31 92 36
           Q 83 47 70 57
           Q 74 73 75 84
           Q 62 77 50 70
           Q 35 80 24 86
           Q 24 71 29 57
           Q 17 47 11 37
           Q 23 33 39 35
           Q 44 19 50 7 Z"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Eye — almond shape, upper lid slightly more arched */}
      <path
        d="M 36 50
           C 38 39 62 39 64 50
           C 62 61 38 61 36 50 Z"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Iris ring */}
      <circle cx="50" cy="50" r="7" stroke="currentColor" strokeWidth="3.5" fill="none" />
      {/* Pupil */}
      <circle cx="50" cy="50" r="3.2" fill="currentColor" />
    </svg>
  );
}
