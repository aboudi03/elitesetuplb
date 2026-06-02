import Link from "next/link";
import { FaEye } from "react-icons/fa";

type ViewActionLinkProps = {
  href: string;
  label: string;
};

const ViewActionLink = ({ href, label }: ViewActionLinkProps) => {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[var(--site-border)] bg-[var(--site-panel-soft)] text-[var(--site-text)] transition hover:border-[var(--site-accent)] hover:bg-[var(--site-accent-soft)] hover:text-[var(--site-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--site-accent-soft)]"
    >
      <FaEye aria-hidden="true" className="text-base" />
      <span className="sr-only">{label}</span>
    </Link>
  );
};

export default ViewActionLink;
