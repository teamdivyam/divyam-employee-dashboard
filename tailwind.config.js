/** @type {import('tailwindcss').Config} */

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],

  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },

      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",

        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },

        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },

        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },

        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },

        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },

        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },

        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",

        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },

        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground":
            "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground":
            "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },

        /**
         * Enterprise Dashboard Semantic Colors
         */
        success: {
          DEFAULT: "#16a34a",
          foreground: "#ffffff",
        },

        warning: {
          DEFAULT: "#f59e0b",
          foreground: "#ffffff",
        },

        info: {
          DEFAULT: "#2563eb",
          foreground: "#ffffff",
        },

        danger: {
          DEFAULT: "#dc2626",
          foreground: "#ffffff",
        },

        brand: {
          DEFAULT: "#f97316",
          foreground: "#ffffff",
        },
      },

      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,.04)",
        dropdown: "0 8px 30px rgba(0,0,0,.08)",
        modal: "0 20px 40px rgba(0,0,0,.12)",
        sidebar: "1px 0 0 rgba(0,0,0,.06)",
      },

      maxWidth: {
        content: "1600px",
      },

      transitionTimingFunction: {
        dashboard: "cubic-bezier(0.4, 0, 0.2, 1)",
      },

      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },

        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },

        "fade-in": {
          from: {
            opacity: "0",
          },
          to: {
            opacity: "1",
          },
        },

        "slide-up": {
          from: {
            opacity: "0",
            transform: "translateY(8px)",
          },
          to: {
            opacity: "1",
            transform: "translateY(0)",
          },
        },

        shimmer: {
          "0%": {
            backgroundPosition: "-200% 0",
          },
          "100%": {
            backgroundPosition: "200% 0",
          },
        },
      },

      animation: {
        "accordion-down":
          "accordion-down 0.2s ease-out",

        "accordion-up":
          "accordion-up 0.2s ease-out",

        "fade-in":
          "fade-in 0.25s ease-out",

        "slide-up":
          "slide-up 0.3s ease-out",

        shimmer:
          "shimmer 2s linear infinite",
      },
    },
  },

  plugins: [require("tailwindcss-animate")],
};