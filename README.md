<div align="center">

<p align="center">
  <img src="./docs/Refactored%20(2).png" alt="Team {Refactor;" height="88" />
  &nbsp;&nbsp;&nbsp;&nbsp;
  <img src="./app/finexa-ia/assets/icons/finexa-logo-icon-colorf.png" alt="Finexa IA" height="72" />
</p>
<sub>Equipo <strong>Team {Refactor;</strong> · proyecto <strong>Finexa IA</strong></sub>

**Resiliencia financiera proactiva para ingresos variables.**  
La plataforma combina datos bancarios agregados (Plaid), patrones de gasto y señales de comportamiento para anticipar tensiones de liquidez, detectar gastos hormiga y acompañar decisiones con contexto claro — sin sustituir el juicio del usuario.

Arquitectura **cloud-native** en **AWS**: backend **serverless** (API Gateway + Lambda en contenedores ECR), identidad y secretos como **servicios gestionados** (Cognito, Secrets Manager), datos en **RDS** opcional; la app móvil (Expo) es el cliente ligero frente a esa nube — sin servidores dedicados (EC2) ni orquestación propia 24/7 en el MVP.

[![Expo](https://img.shields.io/badge/Expo-54-000020?style=flat&logo=expo)](https://expo.dev/)
[![React Native](https://img.shields.io/badge/React_Native-0.81-61DAFB?style=flat&logo=react)](https://reactnative.dev/)
[![Go](https://img.shields.io/badge/Go-1.25-00ADD8?style=flat&logo=go)](https://go.dev/)
[![Terraform](https://img.shields.io/badge/Terraform-IaC-844FBA?style=flat&logo=terraform)](https://www.terraform.io/)
[![AWS](https://img.shields.io/badge/AWS-Cloud-FF9900?style=flat&logo=amazon-aws)](https://aws.amazon.com/)
[![Cloud Native](https://img.shields.io/badge/Arquitectura-Cloud_native_%2B_Serverless-232F3E?style=flat&logo=amazon-aws&logoColor=FF9900)](https://aws.amazon.com/serverless/)

</div>

<p align="center">
  <img src="./docs/sdg-ods-logo.png" width="160" alt="Objetivos de Desarrollo Sostenible (referencia visual Agenda 2030)" />
  <br />
  <sub><a href="https://blog.wearedrew.co/que-son-los-ods-y-por-que-son-importantes-para-las-empresas-privadas">¿Qué son los ODS y por qué son importantes para las empresas privadas?</a> · imagen versionada en el repo para que cargue bien en GitHub.</sub>
</p>

## Objetivos de Desarrollo Sostenible (ODS)

**Track:** **ODS 8** — Trabajo decente y crecimiento económico.

**Aporte del proyecto:** Finexa IA vincula cuentas con **Plaid**, unifica movimientos y ofrece visibilidad frente a **ingresos variables** (freelance, gig, comisiones): anticipar tensiones de liquidez y detectar **gastos hormiga** para decidir con datos — no adivinando el mes a mes.

---

<p align="center">
  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/AWS_Simple_Icons_AWS_Cloud.svg/1280px-AWS_Simple_Icons_AWS_Cloud.svg.png" height="34" alt="AWS" />
  &nbsp;&nbsp;
  <img src="https://cdn.simpleicons.org/terraform/844FBA" height="34" alt="Terraform" />
  &nbsp;&nbsp;
  <img src="https://cdn.simpleicons.org/go/00ADD8" height="34" alt="Go" />
</p>

## Arquitectura del sistema

La solución está pensada **nativa en la nube**: la API pública vive en **AWS** como **compute serverless** (Lambda), delante de **API Gateway**; la app solo orquesta UI y llamadas autenticadas — el “cerebro” operativo y el escalado están en **servicios gestionados**, no en máquinas virtuales mantenidas a mano.

### Decisiones (por qué · beneficio · impacto)

| Elección | Resumen |
|----------|---------|
| **Go + microservicios + API Gateway HTTP (v2) + Lambda + ECR** | **Por qué:** patrón **serverless**: sin servidor aprovisionado; Go liviano en Lambda; `ms-users` / `ms-plaid` / `ms-transactions` separan dominios; misma imagen en CI y ECR. **Beneficio:** despliegues y tests por servicio; coste por uso (pago por invocación). **Impacto:** Plaid y salud financiera sin que un fallo tumbe todo el backend. |
| **Expo + React Native + expo-router** | **Por qué:** un codebase iOS/Android/web y rutas por archivos. **Beneficio:** menos mantenimiento que tres nativos; Plaid Link SDK. **Impacto:** el usuario vincula cuentas y ve señales de gasto en una sola app. |
| **Cognito + JWT + Amplify** | **Por qué:** **IdP y tokens gestionados** en la nube; validación JWT en API Gateway; Amplify en cliente. **Beneficio:** cero auth server propio. **Impacto:** identidad alineada con datos bancarios y perfil interno. |
| **PostgreSQL (Docker / RDS)** | **Por qué:** relacional con FK entre `users` y Plaid. **Beneficio:** local con Docker; RDS en cloud. **Impacto:** datos coherentes para liquidez y auditoría de link. |
| **Terraform** | **Por qué:** infra como código (véase [`infra/README.md`](infra/README.md)). **Beneficio:** menos consola manual. **Impacto:** MVP reproducible y evolución a piloto sin rediseñar despliegue. |

### Eficiencia y optimización

- **Modelo serverless:** la API no corre en VMs fijas; **Lambda** escala con la demanda y a cero si no hay tráfico.
- **API Gateway + prefijos:** un frente HTTP gestionado, CORS simple, rutas calientes estables.
- **Docker CI = ECR:** misma imagen en pipeline y runtime; menos “funciona en mi máquina”.
- **Una API tras Cognito:** menos round-trips y orígenes en el móvil; secretos vía **Secrets Manager** en la nube, no en el cliente.

### Vista lógica (referencia)

```mermaid
flowchart TB
subgraph cli["Cliente"]
App["Expo + Amplify"]
end
subgraph edge["Borde"]
COG["Cognito"]
GW["API Gateway HTTP"]
end
subgraph srv["Compute"]
L["Lambda Go + ECR"]
end
subgraph dat["Datos"]
SM["Secrets Manager"]
DB[(RDS PostgreSQL)]
end
App --> COG
App -->|JWT| GW
GW --> L
SM --> L
DB --> L
```

### Diagramas (assets)

Sustituir los siguientes archivos en `./docs/` por los diagramas definitivos de la documentación de arquitectura:

![Componentes](./docs/comp.png)

![Despliegue](./docs/deploy.png)

---

<p align="center">
  <img src="https://cdn.simpleicons.org/react/61DAFB" height="34" alt="React" />
  &nbsp;&nbsp;
  <img src="https://cdn.simpleicons.org/expo/000020" height="34" alt="Expo" />
  &nbsp;&nbsp;
  <img src="https://cdn.simpleicons.org/postgresql/4169E1" height="34" alt="PostgreSQL" />
  &nbsp;&nbsp;
  <img src="https://cdn.simpleicons.org/docker/2496ED" height="34" alt="Docker" />
</p>

## Stack tecnológico

| Capa | Tecnología | Rol |
|------|------------|-----|
| **Front-end** | Expo ~54, React Native, React 19, TypeScript, expo-router | App multiplataforma, navegación y UI. |
| **Front-end** | AWS Amplify (`@aws-amplify/react-native`, `aws-amplify`) | Sesión y flujo con Cognito. |
| **Front-end** | axios, react-native-plaid-link-sdk | HTTP tipado y flujo Plaid Link. |
| **Back-end** | Go 1.25, Echo v5, Uber FX | APIs HTTP, inyección de dependencias y ciclo de vida. |
| **Back-end** | sqlc, `database/sql`, PostgreSQL | Acceso a datos tipado y migraciones por servicio. |
| **Back-end** | swaggo / OpenAPI generado | Contrato y documentación de endpoints. |
| **Paquete compartido** | [`backend/pkg/apiresult`](backend/pkg/apiresult) | Respuestas y manejo de errores HTTP coherentes. |
| **Integración** | Plaid API (sandbox / producción según entorno) | Agregación bancaria y tokens vía `ms-plaid`. |
| **Datos** | PostgreSQL 16 (Docker local; RDS en cloud) | Persistencia transaccional única entre microservicios acoplados por esquema. |
| **IA / datos** | Python en [`models/`](models/) | Scripts de preparación de datos y pruebas contra entornos Plaid (no sustituyen inferencia en producción). |
| **Infraestructura** | Terraform, VPC, ECR, API Gateway, Lambda, Cognito | **Cloud-native** en AWS: API **serverless** (Lambda), red y auth gestionados. |
| **Infraestructura** | Secrets Manager, CloudWatch (+ SNS opcional) | Secretos rotados fuera del repo; logs y alertas. |
| **CI/CD** | GitHub Actions ([`.github/workflows/backend-lambda.yml`](.github/workflows/backend-lambda.yml)) | Tests Go, build de imágenes en PR, despliegue controlado a `main`. |

---

<p align="center">
  <img src="https://cdn.simpleicons.org/github/181717" height="32" alt="GitHub" />
  &nbsp;&nbsp;
  <img src="https://cdn.simpleicons.org/git/F05032" height="32" alt="Git" />
</p>

## Calidad de código y estándares

### Estrategia de branching

Se adopta un enfoque cercano a **trunk-based development**: la rama **`main`** concentra la integración continua y el código listo para release. Los cambios entran por **pull request**; el workflow en `.github/workflows/backend-lambda.yml` se dispara con cambios bajo `backend/**` (y el propio workflow). En **push a `main`**, el despliegue a **ECR** y actualización de **Lambda** exige **aprobación manual** del entorno `aws-lambda-deploy` — no es GitFlow clásico (sin ramas `release/*` obligatorias); la disciplina está en revisiones, tests (`make test-all`) y control explícito del pipeline productivo.

### Observabilidad y errores

- **Logging:** `log/slog` hacia stdout; en Lambda los eventos se concentran en **Amazon CloudWatch Logs** para correlación por request.
- **HTTP:** middleware de **Echo** para registro de peticiones y **Recover** para aislar pánics; manejador de errores centralizado vía **apiresult** para respuestas predecibles.
- **Salud:** endpoints de health y readiness según el patrón de cada servicio (p. ej. `/ready` documentado en los README de `ms-*`).
- **Infra:** alarmas métricas y **SNS** opcionales en Terraform para señalizar degradación o umbrales operativos.

### Mantenibilidad

Arquitectura en capas por servicio — **handlers → services → repository** (código generado con **sqlc**), configuración explícita y **FX** para composición. Los contratos HTTP quedan descritos con **Swagger**; el paquete **apiresult** evita duplicar formatos de error y facilita evolucionar la API sin romper clientes.

---

## Modelos de IA e integraciones

### Plaid y flujo de datos

1. El usuario inicia **Plaid Link** en la app (SDK nativo).
2. **`ms-plaid`** emite **link tokens**, intercambia **public tokens** y persiste metadatos de ítems sin exponer secretos al cliente.
3. **PostgreSQL** mantiene la relación usuario ↔ conexión Plaid de forma consistente con **`ms-users`** (identidad anclada a Cognito).
4. **`ms-transactions`** concentra el dominio de movimientos según el alcance desplegado del proyecto.

Este diseño permite sincronizar y consultar datos financieros con latencia acotada por la red y el backend serverless, priorizando rutas síncronas para operaciones interactivas y dejando espacio a procesos asíncronos o por lotes en evoluciones futuras.

### IA (visión vs. implementación actual)

- **Visión de producto:** modelos y reglas que enriquecen transacciones crudas con **detección de gastos hormiga**, picos emocionales de gasto y recomendaciones contextualizadas — orientadas a **baja latencia percibida** en la app y a escalabilidad en la nube.
- **Repositorio hoy:** la carpeta [`models/`](models/) contiene **scripts Python** para generación y limpieza de datos en sandbox (por ejemplo, poblar transacciones de prueba vía API Plaid). **No** hay en este repositorio un servicio de inferencia desplegado en **Amazon SageMaker** ni invocaciones a **Amazon Bedrock** en el código backend analizado; la arquitectura Lambda + API Gateway está **preparada** para integrar una capa de inferencia (HTTP interno, cola o función dedicada) sin rediseñar el cliente móvil.

---

<p align="center">
  <img src="https://cdn.simpleicons.org/nodedotjs/339933" height="32" alt="Node.js" />
  &nbsp;&nbsp;
  <img src="https://cdn.simpleicons.org/npm/CB3837" height="32" alt="npm" />
</p>

## Guía de instalación

### Requisitos previos

- **Node.js** y npm (para la app Expo).
- **Go 1.25** y **Docker** (para backend local e imágenes Lambda).
- **Terraform ≥ 1.5** y **AWS CLI** (para infraestructura y despliegue).

### Aplicación móvil

```bash
cd app/finexa-ia
npm install
npx expo start
```

Configurar variables públicas de entorno según tu despliegue (por convención Expo, p. ej. `EXPO_PUBLIC_*`) para la URL base del API, el pool de Cognito y demás valores que exponga [`infra/README.md`](infra/README.md) tras `terraform apply`.

### Backend local (PostgreSQL + servicio)

```bash
cd backend
docker compose up -d
```

Aplicar migraciones y generar código **sqlc** según el README de cada servicio bajo `backend/services/ms-*`. Arrancar un microservicio:

```bash
make run SVC=ms-plaid
```

Definir `DATABASE_URL` (y secretos Plaid) apuntando al Postgres local (`localhost:5432`, usuario/contraseña según [`backend/docker-compose.yml`](backend/docker-compose.yml)).

### Infraestructura (AWS)

Seguir la guía detallada en **[`infra/README.md`](infra/README.md)** (bootstrap de estado remoto S3/DynamoDB, `terraform init`, `terraform apply`, checklist de Cognito, ECR y secretos).

### Despliegue de Lambdas (ECR)

Con credenciales AWS válidas y repositorios ECR creados por Terraform:

```bash
cd backend
make lambda-deploy
```

Variables típicas: `AWS_REGION`, `LAMBDA_PROJECT`, `LAMBDA_ENV`, `TAG_SHA` (ver [`backend/Makefile`](backend/Makefile)).

---

## Roadmap y mejoras futuras

- Integrar **inferencia gestionada** (p. ej. endpoint **SageMaker** o modelos fundacionales vía **Bedrock**) detrás de una API interna o cola, con límites de coste y latencia definidos.
- Profundizar categorización de comercios y series temporales sobre el histórico ya almacenado.
- Notificaciones proactivas (push / email) gobernadas por preferencias del usuario.
- Pruebas de carga sobre API Gateway + Lambda y ajuste de memoria/concurrencia reservada donde el presupuesto lo permita.
- Trazas distribuidas (p. ej. AWS X-Ray) para depurar latencias extremo a extremo.

---

## Estructura del monorepo (referencia)

```
finexa-ia/
├── app/finexa-ia/          # Cliente Expo / React Native
├── backend/
│   ├── pkg/apiresult/      # Utilidades HTTP compartidas
│   ├── services/
│   │   ├── ms-plaid/
│   │   ├── ms-transactions/
│   │   └── ms-users/
│   ├── docker-compose.yml
│   └── Makefile
├── infra/                  # Terraform (MVP)
├── models/                 # Scripts Python (datos / sandbox)
└── docs/                   # Team Refactor, sdg-ods-logo.png, diagramas comp.png / deploy.png
```

---

## Documentación adicional

- [Infraestructura Terraform — MVP](infra/README.md)
- [API HTTP + Lambdas (módulo)](infra/modules/http-api-lambdas/README.md)
- [ms-users](backend/services/ms-users/README.md)
