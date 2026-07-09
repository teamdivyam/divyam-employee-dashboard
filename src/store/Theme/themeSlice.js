// store/themeSlice.js
import { createSlice } from "@reduxjs/toolkit";

const savedTheme = localStorage.getItem("theme");
const initialTheme = ["light", "dark"].includes(savedTheme) ? savedTheme : "light";

const themeSlice = createSlice({
  name: "theme",
  initialState: initialTheme,
  reducers: {
    setLightTheme: () => "light",
    setDarkTheme: () => "dark",
    toggleTheme: (state) => (state === "light" ? "dark" : "light"),
  },
});

export const { setLightTheme, setDarkTheme, toggleTheme } =
  themeSlice.actions;

export default themeSlice.reducer;
