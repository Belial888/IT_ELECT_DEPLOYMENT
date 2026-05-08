export default function Logo({ size = 40, showText = false, className = "" }) {
  return (
    <div className={`logo ${showText ? "logoFull" : ""} ${className}`.trim()}>
      <svg
        className="logoMark"
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect width="64" height="64" rx="16" fill="url(#logo-bg)" />
        <path
          d="M18 41.5V18h17.2c7.1 0 11.8 4.2 11.8 10.5S42.3 39 35.2 39H27v2.5c0 3.6-2.9 6.5-6.5 6.5H18v-6.5Z"
          fill="white"
          opacity="0.96"
        />
        <path
          d="M27 26.2v5.6h7.2c2.4 0 3.9-1.1 3.9-2.8 0-1.8-1.5-2.8-3.9-2.8H27Z"
          fill="#1F8FE5"
        />
        <path
          d="M27 41.5c5.9 3.6 12.8 3.3 18.1-.8"
          stroke="#13B8D6"
          strokeWidth="4.2"
          strokeLinecap="round"
        />
        <path
          d="M42.7 36.8l2.7 3.9 4.2-6.3"
          stroke="white"
          strokeWidth="3.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <defs>
          <linearGradient id="logo-bg" x1="8" y1="7" x2="58" y2="58" gradientUnits="userSpaceOnUse">
            <stop stopColor="#173B5D" />
            <stop offset="0.52" stopColor="#1F8FE5" />
            <stop offset="1" stopColor="#13B8D6" />
          </linearGradient>
        </defs>
      </svg>
      {showText && (
        <span className="logoText">
          <strong>PWDConnect</strong>
          <small>PH</small>
        </span>
      )}
    </div>
  );
}
