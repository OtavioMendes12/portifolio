// Ícone e cor de marca de cada habilidade (só front-end; skills.js fica com dados puros).
// As cores entram via CSS var (--brand). Nos temas claro/matrix o tema troca por --accent
// (token --skill-mono em theme.css), então nenhum componente tem cor fixa no CSS.
// Cores escuras de marca (ex.: Kafka) foram clareadas para ter contraste ≥ 3:1 em fundo escuro.
import {
  SiGo, SiPython, SiTypescript, SiSpringboot, SiHibernate, SiAngular, SiPostgresql, SiRedis,
  SiRabbitmq, SiApachekafka, SiKubernetes, SiDocker, SiGitlab, SiGrafana, SiPrometheus, SiOpentelemetry, SiSelenium,
} from 'react-icons/si';
import { FaAws, FaCubes, FaDatabase, FaEnvelopesBulk, FaJava, FaMasksTheater } from 'react-icons/fa6';

export const SKILL_META = {
  Java: { Icon: FaJava, brand: '#f89820' },
  Go: { Icon: SiGo, brand: '#00add8' },
  Python: { Icon: SiPython, brand: '#4b8bbe' },
  SQL: { Icon: FaDatabase, brand: '#5aa7e0' },
  TypeScript: { Icon: SiTypescript, brand: '#4a8fde' },
  'Spring Boot': { Icon: SiSpringboot, brand: '#6db33f' },
  'Hibernate / Envers': { Icon: SiHibernate, brand: '#bcae79' },
  Angular: { Icon: SiAngular, brand: '#f0335a' },
  PostgreSQL: { Icon: SiPostgresql, brand: '#6b8fe8' },
  Redis: { Icon: SiRedis, brand: '#ff4438' },
  RabbitMQ: { Icon: SiRabbitmq, brand: '#ff6600' },
  Kafka: { Icon: SiApachekafka, brand: '#d4d4d4' },
  'Amazon SQS': { Icon: FaEnvelopesBulk, brand: '#ff9900' },
  'AWS (EC2, S3, SQS, CloudFront)': { Icon: FaAws, brand: '#ff9900' },
  'Kubernetes / EKS': { Icon: SiKubernetes, brand: '#4b82ea' },
  Docker: { Icon: SiDocker, brand: '#2496ed' },
  'GitLab CI/CD': { Icon: SiGitlab, brand: '#fc6d26' },
  Grafana: { Icon: SiGrafana, brand: '#f46800' },
  Prometheus: { Icon: SiPrometheus, brand: '#e6522c' },
  OpenTelemetry: { Icon: SiOpentelemetry, brand: '#f5a800' },
  Microsserviços: { Icon: FaCubes, brand: '#a78bfa' },
  Playwright: { Icon: FaMasksTheater, brand: '#45ba4b' },
  Selenium: { Icon: SiSelenium, brand: '#43b02a' },
};

/** Nome curto: "AWS (EC2, ...)" → "AWS", "Kubernetes / EKS" → "Kubernetes". */
export const shortName = (name) => name.replace(/ \(.*\)/, '').replace(/ \/ .*/, '');
