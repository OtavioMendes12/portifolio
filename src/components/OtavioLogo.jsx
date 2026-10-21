/** Logo: uma pessoa pescando na ponta de um píer. Desenho original, cor via currentColor. */
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
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* chapéu e cabeça */}
      <path d="M8.5 19.5h13" />
      <path d="M11 19.5c.4-4 2.2-5.8 4-5.8s3.6 1.8 4 5.8" />
      <circle cx="15" cy="23.6" r="3.6" />
      {/* tronco, braço e pernas penduradas para fora do píer */}
      <path d="M15.5 27.4c.6 4.4 1.2 8.4 2 12.4" />
      <path d="M16 30.5l6.4 1.8 2.2-1" />
      <path d="M17.5 39.8h7.6l1.6 8.4" />
      <path d="M26.7 48.2h2.6" />
      {/* píer */}
      <path d="M3 41.8h23.5" />
      <path d="M3 44.6h23.5" />
      <path d="M7 44.6v11M22 44.6v11" />
      {/* vara (curvada) e linha */}
      <path d="M21 34.2C30 26 40 15.5 53.5 8.5" strokeWidth="2.2" />
      <path d="M53.5 8.5c1 12 .3 25.5-1.5 38" strokeWidth="1.3" />
      {/* boia e ondinha em volta */}
      <circle cx="52" cy="48.4" r="1.9" fill="currentColor" stroke="none" />
      <path d="M47.5 51.2c3 1.4 6 1.4 9 0" strokeWidth="1.8" />
      {/* água */}
      <path d="M2 55.5c2.5-2 5-2 7.5 0s5 2 7.5 0 5-2 7.5 0 5 2 7.5 0 5-2 7.5 0 5 2 7.5 0 5-2 7.5 0 5 2 7.5 0" />
      {/* peixe curioso */}
      <path d="M34 60.5c2.6-2.4 6.2-2.4 8.6 0-2.4 2.4-6 2.4-8.6 0z" strokeWidth="2" />
      <path d="M42.6 60.5l2.6-2v4z" strokeWidth="2" />
    </svg>
  );
}
