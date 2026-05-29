# CareSync Backend API

**CareSync Healthcare Ecosystem** — Node.js/Express REST API com conformidade HIPAA/GDPR (CNPD-58/2019), dual-database architecture (PII + Medical), e documentação automática Swagger/OpenAPI 3.0.

---

## Stack Técnica

| Componente | Versão | Função |
|---|---|---|
| Express | 5.2.1 | Framework HTTP |
| Sequelize | 6.37.8 | ORM (PostgreSQL) |
| Supabase PostgreSQL | — | Dual DB: PII + Medical |
| JWT + bcryptjs | 9.0.3 / 3.0.3 | Auth & hashing |
| swagger-jsdoc / swagger-ui-express | 6.2.8 / 5.0.1 | API docs |
| socket.io | 4.8.3 | Real-time notifications |
| Winston | 3.19.0 | Logging estruturado |
| Redis | 5.12.1 | Rate limiting avançado |
| speakeasy | 2.0.0 | 2FA TOTP |
| helmet | 8.1.0 | Security headers |
| pdfkit / pdf-parse | 0.18.0 / 2.4.5 | Geração/parsing de PDFs |

---

## Estrutura de Diretórios
backend/
├── logs/
├── scripts/
│ └── generateApiDocs.js # Script CLI para gerar api-docs.json público
├── src/
│ ├── config/
│ │ ├── database.js # Dual Sequelize: sequelizePii + sequelizeMedical
│ │ └── rateLimiter.js
│ ├── controllers/
│ │ ├── authController.js
│ │ ├── caregiverController.js
│ │ ├── deviceController.js
│ │ ├── medicationController.js
│ │ ├── notificationController.js
│ │ ├── prescriptionController.js
│ │ └── userController.js
│ ├── middleware/
│ │ ├── auth.js # JWT authMiddleware + requireRole
│ │ ├── csrf.js # csrf-csrf tokens
│ │ ├── errorHandler.js # asyncHandler + AppError/AuthenticationError
│ │ ├── rateLimiter.js
│ │ ├── requestLogger.js # generateRequestId + logRequest
│ │ └── validationMiddleware.js
│ ├── models/
│ │ ├── index.js # Associações Sequelize + exports
│ │ ├── User.js # PII DB — toJSON() strips sensitive fields
│ │ ├── CaregiverPatient.js # PII DB
│ │ ├── AuditLog.js # PII DB — paranoid:false, encripted payloads
│ │ ├── ConsentLog.js # PII DB
│ │ ├── Notification.js # PII DB
│ │ ├── Medication.js # Medical DB — isPRN flag, inventory guards
│ │ ├── Prescription.js # Medical DB — campos encriptados (sequelize-encrypted)
│ │ ├── Adherence.js # Medical DB — composite unique index
│ │ ├── Device.js # Medical DB
│ │ ├── DeviceAccessPermission.js
│ │ ├── DeviceInvitation.js
│ │ └── DocumentMetadata.js # Medical DB — paranoid:false
│ ├── routes/
│ │ ├── api-docs.js # POST /api/api-docs/generate (dev only)
│ │ ├── auth.js
│ │ ├── caregivers.js
│ │ ├── consent.js
│ │ ├── devices.js
│ │ ├── medications.js
│ │ ├── notifications.js
│ │ ├── patients.js
│ │ ├── prescriptions.js
│ │ ├── reports.js
│ │ ├── twoFactor.js
│ │ └── users.js
│ ├── services/
│ │ ├── apiDocGenerator.js # Swagger + privacy metadata → api-docs.json
│ │ ├── auditLogService.js # CNPD-58/2019 encrypted audit trail
│ │ ├── authService.js
│ │ ├── caregiverService.js
│ │ ├── deviceService.js
│ │ ├── enhancedPdfService.js
│ │ ├── medicationService.js
│ │ ├── notificationService.js
│ │ ├── pdfService.js
│ │ ├── pemParserService.js
│ │ └── prescriptionParser.js
│ ├── utils/
│ │ ├── ApiResponse.js # Wrapper de respostas uniformes
│ │ ├── crossDbHelper.js # Queries cross-database (PII ↔ Medical)
│ │ ├── encryption.js # AES-256 encrypt/decrypt
│ │ ├── jwtUtils.js # generateToken + generateRefreshToken
│ │ ├── logger.js # Winston logger configurado
│ │ └── sampleDataGenerator.js # Seed de dados em dev
│ ├── app.js # Express app + middleware pipeline
│ ├── index.js # Ponto de entrada do servidor
│ └── swagger.js # Configuração swagger-jsdoc
└── .env.example

text

---

## Configuração

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar variáveis de ambiente
```bash
cp .env.example .env
# Editar .env com as credenciais reais
```

Variáveis obrigatórias:
```env
DATABASE_URL=postgresql://postgres.<ref>:<pass>@aws-1-eu-west-1.pooler.supabase.com:5432/postgres
JWT_SECRET=                  # 32 bytes hex
JWT_REFRESH_SECRET=          # 32 bytes hex
ENCRYPTION_KEY=              # 24 bytes base64
MASTER_KEY=                  # 24 bytes base64
CSRF_SECRET=                 # 16 bytes hex
SESSION_SECRET=              # 16 bytes hex
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

Gerar segredos:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"    # JWT secrets
node -e "console.log(require('crypto').randomBytes(24).toString('base64'))" # Encryption keys
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"    # CSRF/Session
```

### 3. Iniciar servidor
```bash
npm run dev   # Desenvolvimento (nodemon)
npm start     # Produção
```

---

## Arquitetura Dual-Database

O CareSync separa dados por sensibilidade:

| Base de dados | Modelos | Propósito |
|---|---|---|
| **PII DB** (`sequelizePii`) | User, CaregiverPatient, AuditLog, ConsentLog, Notification | Dados de identidade e governança |
| **Medical DB** (`sequelizeMedical`) | Medication, Prescription, Adherence, Device, DeviceAccessPermission, DeviceInvitation, DocumentMetadata | Dados clínicos sensíveis |

As relações cross-database são resolvidas via `crossDbHelper.js` — sem JOINs entre bases, apenas por UUID.

---

## Endpoints Disponíveis

| Prefixo | Ficheiro | Auth | Descrição |
|---|---|---|---|
| `GET /health` | app.js | ❌ | Health check |
| `GET /api/csrf-token` | app.js | ❌ | Obter token CSRF |
| `POST /api/auth/register` | routes/auth.js | ❌ | Registo de utilizador |
| `POST /api/auth/login` | routes/auth.js | ❌ | Login (suporta 2FA) |
| `GET /api/auth/me` | routes/auth.js | ✅ | Perfil autenticado |
| `PUT /api/auth/profile` | routes/auth.js | ✅ | Atualizar perfil |
| `POST /api/auth/change-password` | routes/auth.js | ✅ | Alterar password |
| `POST /api/auth/refresh-token` | routes/auth.js | ❌ | Renovar JWT |
| `POST /api/auth/logout` | routes/auth.js | ✅ | Terminar sessão |
| `DELETE /api/auth/account` | routes/auth.js | ✅ | Apagar conta (GDPR) |
| `GET /api/users/:id` | routes/users.js | ✅ | Obter utilizador |
| `PATCH /api/users/:id/status` | routes/users.js | ✅ Admin | Atualizar estado |
| `GET /api/medications` | routes/medications.js | ✅ | Listar medicamentos |
| `POST /api/medications` | routes/medications.js | ✅ | Criar medicamento |
| `POST /api/medications/adherence` | routes/medications.js | ✅ | Registar adesão |
| `GET /api/caregivers` | routes/caregivers.js | ✅ | Cuidadores do utilizador |
| `POST /api/caregivers/invite` | routes/caregivers.js | ✅ | Convidar cuidador |
| `GET /api/caregivers/pending` | routes/caregivers.js | ✅ | Convites pendentes |
| `GET /api/devices` | routes/devices.js | ✅ | Listar dispositivos |
| `POST /api/devices/register` | routes/devices.js | ✅ | Registar dispositivo |
| `GET /api/patients` | routes/patients.js | ✅ | Pacientes do cuidador |
| `GET /api/notifications` | routes/notifications.js | ✅ | Notificações |
| `GET /api/reports/adherence` | routes/reports.js | ✅ | Relatório de adesão |
| `GET /api/prescriptions` | routes/prescriptions.js | ✅ | Prescrições |
| `POST /api/2fa/setup` | routes/twoFactor.js | ✅ | Configurar 2FA |
| `POST /api/2fa/verify` | routes/twoFactor.js | ✅ | Verificar código 2FA |
| `GET /api/consent` | routes/consent.js | ✅ | Logs de consentimento |
| `POST /api/api-docs/generate` | routes/api-docs.js | ❌ Dev | Gerar docs públicas |

A documentação Swagger interativa está disponível em: `GET /api-docs`

---

## Gerar Documentação de API Pública

O script `generateApiDocs.js` lê as anotações JSDoc Swagger de todas as routes e gera um ficheiro `frontend/public/api-docs.json` enriquecido com metadados de privacidade (RGPD/HIPAA).

```bash
npm run generate-docs
```

Ou via HTTP em desenvolvimento:
```bash
curl -X POST http://localhost:5000/api/api-docs/generate
```

O ficheiro gerado inclui por cada endpoint:
- Método HTTP, path, descrição, tags
- Se requer autenticação
- Rate limit específico
- `dataCollected` — dados recolhidos
- `dataShared` — com quem são partilhados
- `retention` — política de retenção
- `hipaaCompliant`, `gdprCompliant` — flags de conformidade
- Exemplos de request/response gerados automaticamente

---

## Segurança

- **CSRF**: tokens via `csrf-csrf`, injetados em cookie `HttpOnly`
- **Rate limiting**: global (200 req/15min) + por-rota configurável via Redis
- **Passwords**: bcrypt com 12 rounds
- **JWT**: access token (7d) + refresh token (30d) em cookie HttpOnly
- **Dados sensíveis**: encriptados em repouso com AES-256 via `sequelize-encrypted`
- **Audit trail**: todas as ações são logadas encriptadas conforme CNPD-58/2019
- **Headers**: Helmet com CSP configurada para Vercel + Capacitor
- **2FA**: TOTP via speakeasy + QR code

---

## Conformidade

| Norma | Estado | Mecanismo |
|---|---|---|
| HIPAA | ✅ | Audit logs encriptados, dados médicos separados |
| GDPR/RGPD | ✅ | `DELETE /api/auth/account` apaga todos os dados + anonimização |
| CNPD-58/2019 | ✅ | `justification` obrigatório em AuditLog, retenção definida |

---

## Scripts Disponíveis

```bash
npm run dev           # Servidor de desenvolvimento (nodemon)
npm start             # Produção
npm run generate-docs # Gerar api-docs.json para o frontend
npm run migrate       # Executar migrações Sequelize
npm run seed          # Popular base de dados com dados de exemplo
```