// Habilidades por grupo. level: 1 (básico) a 5 (domínio). Ajuste à vontade.
export const skillGroups = [
  {
    id: 'langs',
    title: { pt: 'Linguagens', en: 'Languages' },
    items: [
      { name: 'Java', level: 5 },
      { name: 'Go', level: 3 },
      { name: 'Python', level: 4 },
      { name: 'SQL', level: 4 },
      { name: 'TypeScript', level: 2 },
    ],
  },
  {
    id: 'frameworks',
    title: { pt: 'Frameworks', en: 'Frameworks' },
    items: [
      { name: 'Spring Boot', level: 5 },
      { name: 'Hibernate / Envers', level: 4 },
      { name: 'Angular', level: 3 },
    ],
  },
  {
    id: 'data',
    title: { pt: 'Dados e mensageria', en: 'Data & messaging' },
    items: [
      { name: 'PostgreSQL', level: 4 },
      { name: 'RabbitMQ', level: 4 },
      { name: 'Kafka', level: 3 },
      { name: 'Amazon SQS', level: 4 },
    ],
  },
  {
    id: 'cloud',
    title: { pt: 'Cloud e DevOps', en: 'Cloud & DevOps' },
    items: [
      { name: 'AWS (EC2, S3, SQS, CloudFront)', level: 4 },
      { name: 'Kubernetes / EKS', level: 3 },
      { name: 'Docker', level: 4 },
      { name: 'GitLab CI/CD', level: 4 },
      { name: 'Grafana', level: 3 },
    ],
  },
  {
    id: 'arch',
    title: { pt: 'Arquitetura e automação', en: 'Architecture & automation' },
    items: [
      { name: 'Microsserviços', level: 4 },
      { name: 'Playwright', level: 4 },
      { name: 'Selenium', level: 4 },
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
