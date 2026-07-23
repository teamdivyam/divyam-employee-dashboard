import PropTypes from "prop-types";
import { LockKeyhole } from "lucide-react";

export default function PageLocked({
  title = "Page Locked",
  description = "This page is currently locked while construction is in progress. Please check back later.",
  className = "",
}) {
  return (
    <div
      role="status"
      aria-label={title}
      className={`absolute inset-0 z-30 flex items-center justify-center bg-background/65 p-4 backdrop-blur-[2px] ${className}`}
    >
      <div className="w-full max-w-md rounded-2xl border border-border/80 bg-card/90 px-6 py-8 text-center text-card-foreground shadow-xl backdrop-blur-md">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
          <LockKeyhole className="h-7 w-7" aria-hidden="true" />
        </span>

        <h1 className="mt-5 text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}

PageLocked.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  className: PropTypes.string,
};
