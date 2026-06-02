import Image from "next/image";
import Link from "next/link";

type EliteSetupLogoProps = {
  showText?: boolean;
  href?: string;
  className?: string;
  iconClassName?: string;
  textClassName?: string;
};

export function EliteSetupLogo({
  showText = true,
  href = "/",
  className = "",
  iconClassName = "",
  textClassName = "",
}: EliteSetupLogoProps) {
  const content = (
    <div className={`flex items-center gap-4 ${className}`}>
      <Image
        src="/elitesetup_es_icon_transparent.png"
        alt="Elite Setup icon"
        width={64}
        height={64}
        className={`h-[3.3rem] w-auto shrink-0 object-contain ${iconClassName}`}
        priority
      />

      {showText && (
        <Image
          src="/elitesetup_wordmark_transparent.png"
          alt="EliteSetup"
          width={340}
          height={64}
          className={`h-9 w-auto translate-y-[1px] object-contain max-sm:h-7 ${textClassName}`}
          priority
        />
      )}
    </div>
  );

  if (!href) {
    return content;
  }

  return (
    <Link href={href} aria-label="Elite Setup home">
      {content}
    </Link>
  );
}

export default EliteSetupLogo;
