// Habilidades por grupo. level: 0–100 (%). Ajuste à vontade.
// Faixas: >= 80 avançado · >= 55 intermediário · abaixo, básico.
export const skillGroups = [
  {
    id: 'langs',
    title: { pt: 'Linguagens', en: 'Languages' },
    items: [
      { name: 'Java', level: 90 },
      { name: 'Go', level: 65 },
      { name: 'Python', level: 80 },
      { name: 'SQL', level: 80 },
      { name: 'TypeScript', level: 45 },
    ],
  },
  {
    id: 'frameworks',
    title: { pt: 'Frameworks', en: 'Frameworks' },
    items: [
      { name: 'Spring Boot', level: 90 },
      { name: 'Hibernate / Envers', level: 80 },
      { name: 'Angular', level: 60 },
    ],
  },
  {
    id: 'data',
    title: { pt: 'Dados e mensageria', en: 'Data & messaging' },
    items: [
      { name: 'PostgreSQL', level: 80 },
      { name: 'Redis', level: 60 },
      { name: 'RabbitMQ', level: 80 },
      { name: 'Kafka', level: 65 },
      { name: 'Amazon SQS', level: 80 },
    ],
  },
  {
    id: 'cloud',
    title: { pt: 'Cloud e DevOps', en: 'Cloud & DevOps' },
    items: [
      { name: 'AWS (EC2, S3, SQS, CloudFront)', level: 75 },
      { name: 'Kubernetes / EKS', level: 60 },
      { name: 'Docker', level: 80 },
      { name: 'GitLab CI/CD', level: 75 },
    ],
  },
  {
    id: 'observability',
    title: { pt: 'Observabilidade', en: 'Observability' },
    items: [
      { name: 'Grafana', level: 65 },
      { name: 'Prometheus', level: 60 },
      { name: 'OpenTelemetry', level: 55 },
    ],
  },
  {
    id: 'arch',
    title: { pt: 'Arquitetura e automação', en: 'Architecture & automation' },
    items: [
      { name: 'Microsserviços', level: 85 },
      { name: 'Playwright', level: 80 },
      { name: 'Selenium', level: 80 },
    ],
  },
];

// Linguagens de programação (para os números do `sobre`).
export const programmingLanguages = ['Java', 'Go', 'Python', 'SQL', 'TypeScript', 'C'];

export const spokenLanguages = [
  { pt: 'Português · nativo', en: 'Portuguese · native' },
  { pt: 'Inglês · profissional avançado', en: 'English · advanced professional' },
  { pt: 'Espanhol · profissional limitado', en: 'Spanish · limited professional' },
];

export const levelOf = (pct) => (pct >= 80 ? 'advanced' : pct >= 55 ? 'intermediate' : 'basic');
