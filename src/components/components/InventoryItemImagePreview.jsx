import { cloneElement, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Popover, PopoverTrigger, PopoverContent } from "@components/components/ui/popover";

// The Items & Stock preview, shared without changing thumbnail layout or image sources.
export function ItemImagePreview({ src, alt, children, open, onOpenChange }) {
  const [localOpen, setLocalOpen] = useState(false);
  const [container, setContainer] = useState(undefined);
  const isOpen = open ?? localOpen;
  useEffect(() => {
    if (!isOpen) return;
    // Different Radix layer versions must not dismiss the underlying form as well.
    const closePreview = event => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      setLocalOpen(false);
      onOpenChange?.(false);
    };
    window.addEventListener("keydown", closePreview, true);
    return () => window.removeEventListener("keydown", closePreview, true);
  }, [isOpen, onOpenChange]);
  if (!src) return children;
  const trigger = cloneElement(children, {
    role: children.type === "img" ? "button" : children.props.role,
    tabIndex: children.type === "img" ? 0 : children.props.tabIndex,
    "aria-label": children.props["aria-label"] || `Enlarge image of ${alt || "inventory item"}`,
    className: `${children.props.className || ""} cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`,
    onClick: event => {
      event.stopPropagation();
      setContainer(event.currentTarget.closest('[role="dialog"]') || undefined);
      children.props.onClick?.(event);
    },
    onKeyDown: event => {
      children.props.onKeyDown?.(event);
      if (children.type === "img" && !event.defaultPrevented && ["Enter", " "].includes(event.key)) {
        event.stopPropagation();
        event.preventDefault();
        event.currentTarget.click();
      }
    },
  });
  return (
    <Popover open={isOpen} onOpenChange={next => { setLocalOpen(next); onOpenChange?.(next); }}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        container={container}
        collisionBoundary={container}
        aria-label={`Image preview for ${alt}`}
        side="top" align="start" sideOffset={6} collisionPadding={12}
        hideWhenDetached
        onOpenAutoFocus={event => event.preventDefault()}
        onCloseAutoFocus={event => event.preventDefault()}
        onClick={event => event.stopPropagation()}
        onPointerDown={event => event.stopPropagation()}
        className="w-56 max-w-[calc(100vw-1.5rem)] rounded-lg border-border/80 p-2"
      >
        <img src={src} alt={alt} className="h-48 max-h-[calc(var(--radix-popover-content-available-height)-1rem)] w-full rounded-md object-contain" />
      </PopoverContent>
    </Popover>
  );
}
ItemImagePreview.propTypes = { src: PropTypes.string, alt: PropTypes.string, children: PropTypes.element.isRequired, open: PropTypes.bool, onOpenChange: PropTypes.func };

export function ItemPreviewImage({ preview = true, ...props }) {
  const thumbnail = <img {...props} />;
  return preview ? <ItemImagePreview src={props.src} alt={props.alt}>{thumbnail}</ItemImagePreview> : thumbnail;
}
ItemPreviewImage.propTypes = { preview: PropTypes.bool, src: PropTypes.string, alt: PropTypes.string };
