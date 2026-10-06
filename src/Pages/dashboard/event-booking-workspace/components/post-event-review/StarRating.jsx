/* eslint-disable react/prop-types */
import { useState } from "react";
import { Star } from "lucide-react";

export default function StarRating({
  value = 0,
  onChange,
  readonly = false,
  size = "md",
}) {
  const [hovered, setHovered] = useState(0);
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : size === "lg" ? "h-7 w-7" : "h-5 w-5";

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = (hovered || value) >= star;
        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            className={`focus:outline-none ${
              readonly
                ? "cursor-default"
                : "cursor-pointer transition-transform hover:scale-110"
            }`}
            onClick={() => !readonly && onChange?.(star === value ? 0 : star)}
            onMouseEnter={() => !readonly && setHovered(star)}
            onMouseLeave={() => !readonly && setHovered(0)}
          >
            <Star
              className={`${iconSize} transition-colors ${
                isFilled
                  ? "fill-[#FBBF24] text-[#FBBF24]"
                  : "fill-none text-gray-300"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}


