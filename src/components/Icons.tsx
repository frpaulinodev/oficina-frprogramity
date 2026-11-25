type P = { className?: string };
const base = (d: string | string[]) => ({ className = "w-4 h-4" }: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    {(Array.isArray(d) ? d : [d]).map((p, i) => <path key={i} d={p} />)}
  </svg>
);

export const IconDashboard = base(["M3 13h8V3H3z", "M13 21h8V11h-8z", "M3 21h8v-6H3z", "M13 3v6h8V3z"]);
export const IconGlobe = base(["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z", "M3.6 9h16.8", "M3.6 15h16.8", "M12 3a14 14 0 0 1 0 18", "M12 3a14 14 0 0 0 0 18"]);
export const IconTable = base(["M3 5h18v14H3z", "M3 10h18", "M9 10v9"]);
export const IconPipeline = base(["M4 4h4v16H4z", "M10 4h4v10h-4z", "M16 4h4v6h-4z"]);
export const IconSearch = base(["M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z", "M21 21l-4.3-4.3"]);
export const IconShield = base(["M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z", "M9 12l2 2 4-4"]);
export const IconDownload = base(["M12 3v12", "M7 10l5 5 5-5", "M4 21h16"]);
export const IconUpload = base(["M12 21V9", "M7 14l5-5 5 5", "M4 3h16"]);
export const IconTag = base(["M3 12V3h9l9 9-9 9z", "M7.5 7.5h.01"]);
export const IconX = base(["M18 6L6 18", "M6 6l12 12"]);
export const IconChevron = base("M9 18l6-6-6-6");
export const IconChevronDown = base("M6 9l6 6 6-6");
export const IconSort = base(["M7 4v16", "M3 8l4-4 4 4", "M17 20V4", "M13 16l4 4 4-4"]);
export const IconExternal = base(["M14 4h6v6", "M20 4l-9 9", "M18 14v6H4V6h6"]);
export const IconPhone = base("M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z");
export const IconMail = base(["M4 4h16v16H4z", "M22 6l-10 7L2 6"]);
export const IconLink = base(["M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7", "M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"]);
export const IconPlus = base(["M12 5v14", "M5 12h14"]);
export const IconRefresh = base(["M21 12a9 9 0 1 1-3-6.7L21 8", "M21 3v5h-5"]);
export const IconLogout = base(["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", "M16 17l5-5-5-5", "M21 12H9"]);
export const IconCheck = base("M20 6L9 17l-5-5");
export const IconAlert = base(["M12 9v4", "M12 17h.01", "M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"]);
export const IconLayers = base(["M12 2l10 6-10 6L2 8z", "M2 16l10 6 10-6", "M2 12l10 6 10-6"]);
export const IconBell = base(["M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9", "M13.7 21a2 2 0 0 1-3.4 0"]);
export const IconMerge = base(["M6 3v6a6 6 0 0 0 6 6h6", "M15 12l3 3-3 3", "M6 21v-6"]);
export const IconTrash = base(["M3 6h18", "M8 6V4h8v2", "M19 6l-1 14H6L5 6"]);
