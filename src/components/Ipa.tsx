type Props = {
  children: string;
  size?: "sm" | "md" | "lg" | "xl";
  slashes?: boolean;
};

const sizes = {
  sm: "text-base",
  md: "text-2xl",
  lg: "text-4xl sm:text-5xl",
  xl: "text-6xl sm:text-7xl",
};

// Transcriptions are always set in Charis SIL, between slashes by default.
export function Ipa({ children, size = "md", slashes = true }: Props) {
  return (
    <span lang="en-GB-fonipa" className={`font-ipa ${sizes[size]} leading-tight break-words`}>
      {slashes ? `/${children}/` : children}
    </span>
  );
}
