// Experiências profissionais (mais recente primeiro). Datas em 'AAAA-MM'; end: null = atual.
export const experiences = [
  {
    id: 'inter',
    company: 'Banco Inter',
    via: 'DTI Digital',
    role: { pt: 'Desenvolvedor Back-end Pleno', en: 'Mid-level Back-end Developer' },
    start: '2026-10',
    end: null,
    mode: null, // preencher: { pt: 'Híbrido', en: 'Hybrid' }
    location: 'Belo Horizonte, MG',
    stack: [],
    bullets: [
      {
        pt: 'Desenvolvimento back-end para o Banco Inter, alocado pela DTI Digital.',
        en: 'Back-end development for Banco Inter, staffed through DTI Digital.',
      },
    ],
  },
  {
    id: 'itexto',
    company: 'itexto Consultoria',
    role: { pt: 'Desenvolvedor Fullstack Pleno', en: 'Mid-level Fullstack Developer' },
    start: '2026-03',
    end: '2026-07',
    mode: { pt: 'Híbrido', en: 'Hybrid' },
    location: 'Belo Horizonte, MG',
    stack: ['Java', 'Spring Boot', 'Go', 'Angular', 'PostgreSQL', 'AWS', 'Amazon SQS', 'Grafana'],
    bullets: [
      {
        pt: 'Sistemas corporativos de alta demanda em Java, Go e Angular, com AWS e Amazon SQS.',
        en: 'High-demand enterprise systems in Java, Go and Angular, running on AWS with Amazon SQS.',
      },
      {
        pt: 'APIs, regras de negócio e integrações entre serviços, com foco em escalabilidade e clareza de código.',
        en: 'APIs, business rules and service integrations, focused on scalability and code clarity.',
      },
      {
        pt: 'Otimização de uma query crítica que reduziu cerca de US$ 700/mês em infraestrutura para um cliente.',
        en: 'Optimized a critical query, cutting about US$700/month in infrastructure costs for a client.',
      },
      {
        pt: 'Análise de performance, investigação de incidentes em produção e quebra de requisitos em tarefas técnicas para o time.',
        en: 'Performance analysis, production incident investigation and turning requirements into technical tasks for the team.',
      },
    ],
  },
  {
    id: 'buscapassagens',
    company: 'Busca Passagens',
    role: { pt: 'Desenvolvedor Back-end', en: 'Back-end Developer' },
    start: '2024-04',
    end: '2026-03',
    mode: { pt: 'Híbrido', en: 'Hybrid' },
    location: 'Belo Horizonte, MG',
    stack: ['Java', 'Spring Boot', 'Python', 'Go', 'Playwright', 'RabbitMQ', 'Kafka', 'AWS', 'Jenkins', 'Grafana'],
    bullets: [
      {
        pt: 'Portal de passagens aéreas com microsserviços e APIs de emissão.',
        en: 'Airline ticketing portal built on microservices and booking APIs.',
      },
      {
        pt: 'Automações e RPA internas em Python e Java (Spring Boot) com Playwright.',
        en: 'Internal automations and RPA in Python and Java (Spring Boot) with Playwright.',
      },
      {
        pt: 'Mensageria com RabbitMQ e Kafka para melhorar performance, vendas e estabilidade.',
        en: 'Messaging with RabbitMQ and Kafka to improve performance, sales and stability.',
      },
    ],
  },
  {
    id: 'bluetape',
    company: 'Bluetape',
    role: { pt: 'Estágio em Desenvolvimento Back-end', en: 'Back-end Development Intern' },
    start: '2023-04',
    end: '2024-04',
    mode: { pt: 'Híbrido', en: 'Hybrid' },
    location: 'Belo Horizonte, MG',
    stack: ['Python', 'Selenium', 'Pandas', 'AWS EC2', 'AWS S3', 'GitLab'],
    bullets: [
      {
        pt: 'Bots de RPA em Python com Selenium para automação de processos.',
        en: 'Python RPA bots with Selenium for process automation.',
      },
      {
        pt: 'Consumo de APIs externas e melhorias em rotinas de dados com Pandas.',
        en: 'External API integrations and data-processing improvements with Pandas.',
      },
      {
        pt: 'Suporte em ambientes AWS (EC2 e S3) e versionamento com GitLab e GitHub.',
        en: 'Support on AWS environments (EC2 and S3) and version control with GitLab and GitHub.',
      },
    ],
  },
];

export const careerStart = '2023-04';
