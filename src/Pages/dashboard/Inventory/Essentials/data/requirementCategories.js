export const categoryOptions = [
  { label: "Signature Presentation Counter", value: "Signature Presentation Counter", icon: "Store" },
  { label: "Ambient Decor", value: "Ambient Decor", icon: "Flower2" },
  { label: "Royal Buffet Presentation", value: "Royal Buffet Presentation", icon: "CookingPot" },
  { label: "Heritage Dining Collection", value: "Heritage Dining Collection", icon: "UtensilsCrossed" },
  { label: "Culinary Essentials", value: "Culinary Essentials", icon: "ChefHat" },
  { label: "Hospitality Service Collection", value: "Hospitality Service Collection", icon: "HandPlatter" },
  { label: "Storage GN Pans & Utility", value: "Storage GN Pans & Utility", icon: "Container" },
  { label: "Other", value: "Other", icon: "Package" },
];

export const isPredefinedCategory = value => categoryOptions.some(option => option.value !== "Other" && option.value === value);
