const icons = {
  accessibility: [
    "M12 4.5a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6Z",
    "M4.5 7h15",
    "M12 7v6",
    "M8 22l2.2-7",
    "M16 22l-2.2-7",
    "M8.5 13h7"
  ],
  announcement: [
    "M4 12v5a2 2 0 0 0 2 2h1l3 3v-3h2",
    "M4 12h4l9-5v12l-9-5H4z",
    "M19 10.5a3 3 0 0 1 0 3"
  ],
  arrowRight: ["M5 12h14", "M13 6l6 6-6 6"],
  briefcase: [
    "M10 6V5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v1",
    "M4 7h16v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7z",
    "M4 12h16",
    "M10 12v2h4v-2"
  ],
  check: ["M20 6 9 17l-5-5"],
  clipboard: [
    "M9 4h6",
    "M9 4a2 2 0 0 0-2 2H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-1a2 2 0 0 0-2-2",
    "M9 14l2 2 4-4"
  ],
  chart: [
    "M4 19V5",
    "M4 19h16",
    "M8 16v-5",
    "M12 16V8",
    "M16 16v-9"
  ],
  dashboard: [
    "M4 13h7V4H4v9z",
    "M13 20h7V4h-7v16z",
    "M4 20h7v-5H4v5z"
  ],
  download: ["M12 3v12", "M7 10l5 5 5-5", "M5 21h14"],
  file: [
    "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z",
    "M14 2v6h6",
    "M8 13h8",
    "M8 17h5"
  ],
  help: [
    "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z",
    "M9.5 9a2.8 2.8 0 1 1 4.6 2.1c-.9.7-1.4 1.1-1.4 2.4",
    "M12 17h.01"
  ],
  logout: ["M10 17l5-5-5-5", "M15 12H3", "M21 4v16"],
  moon: ["M21 13a8 8 0 1 1-10-10 7 7 0 0 0 10 10z"],
  plus: ["M12 5v14", "M5 12h14"],
  profile: [
    "M20 21a8 8 0 0 0-16 0",
    "M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10z"
  ],
  search: ["M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z", "M21 21l-4.3-4.3"],
  send: ["M22 2 11 13", "M22 2l-7 20-4-9-9-4 20-7z"],
  shield: [
    "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
    "M9 12l2 2 4-4"
  ],
  sun: [
    "M12 4V2",
    "M12 22v-2",
    "M4.9 4.9 3.5 3.5",
    "M20.5 20.5l-1.4-1.4",
    "M2 12h2",
    "M20 12h2",
    "M4.9 19.1l-1.4 1.4",
    "M20.5 3.5l-1.4 1.4",
    "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z"
  ],
  users: [
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",
    "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
    "M22 21v-2a4 4 0 0 0-3-3.9",
    "M16 3.1a4 4 0 0 1 0 7.8"
  ],
  voucher: [
    "M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3a3 3 0 0 0 0 6v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-3a3 3 0 0 0 0-6V6z",
    "M9 9h.01",
    "M15 15h.01",
    "M15 9l-6 6"
  ],
  x: ["M18 6 6 18", "M6 6l12 12"]
};

export default function Icon({ name, size = 18, className = "" }) {
  const paths = icons[name] || icons.file;

  return (
    <svg
      className={`icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths.map((path) => (
        <path key={path} d={path} />
      ))}
    </svg>
  );
}
