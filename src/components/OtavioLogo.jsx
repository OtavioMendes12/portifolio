/** Monograma "O" com um galo minimalista dentro. Cor via currentColor. */
export default function OtavioLogo({ title, size = 96, className = '' }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="32" cy="32" r="28.5" />
      <circle cx="32" cy="32" r="24.5" strokeWidth="1" opacity="0.5" />
      {/* crista */}
      <path d="M31.5 15.5c.6-3 2.8-3.4 3.4-.6c.8-3 3.4-3 3.6.2c1.4-2 3.4-1.2 2.9 1.4" />
      {/* cabeça, bico e barbela */}
      <circle cx="36" cy="19.6" r="3.6" />
      <path d="M39.4 18.6l4.6 1.6l-4.4 1.6" />
      <path d="M37.6 23.2c.4 2.4-.4 3.6-1.8 3.8" />
      {/* pescoço, peito e costas */}
      <path d="M38.6 22.6c3.2 4.8 4.2 10.6 1 15.6" />
      <path d="M32.6 21.8c-2 5.2-6.2 7.8-11.6 7.6" />
      {/* cauda em foice */}
      <path d="M21 29.4c-5.2-2-6.6-8.6-2.8-12.8" />
      <path d="M21 29.4c-6.8.8-9.4-4.8-7.6-9.2" />
      <path d="M21 29.4c-5.6 3.2-8.6-.4-8.2-3.6" />
      {/* barriga e asa */}
      <path d="M21 29.4c.2 6.8 6.4 10.4 18.6 8.8" />
      <path d="M26 31.2c3.2 2.4 7.4 2.2 9.6-.8" />
      {/* pernas */}
      <path d="M28.4 38.8l-1 7.6M34.6 38.6l.8 7.8M24.2 46.4h5.4M33 46.4h5.4" />
    </svg>
  );
}
