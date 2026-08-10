Use index.css style file for theme (dark and light), color and typo.
Font size and boldness should not be large.
Use predefined component as possible, without remake the components.

Tab rules:
- Use the shared `TabComp` component for page-level tabs.
- Store the selected non-default tab in the URL as `?tab=<value>` so the selected tab and its content survive a browser refresh.
- Validate the URL tab value against the page's supported tab values and fall back to the page's default tab when it is missing or invalid.
- Remove the `tab` search parameter when the default tab is selected, while preserving unrelated search parameters.
- Sidebar and other page-entry navigation links must use the clean page URL without a `tab` parameter so opening a page from navigation always starts on its default tab.
