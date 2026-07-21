# Architecture de Paiement — Exam Marketplace

> **Cible :** Fapshi Direct Pay  
> **Principe :** Découplage total du provider. Changement Fapshi → Campay → Stripe = 1 nouvel adapter.  
> **Philosophie :** Architecture professionnelle, sans sur-ingénierie.

---

## 1. Organisation des dossiers

```
src/
├── features/payments/
│   ├── adapters/
│   │   ├── payment-provider.interface.ts    # Contrat universel
│   │   ├── fapshi/
│   │   │   ├── fapshi.adapter.ts            # Implémentation Fapshi Direct Pay
│   │   │   ├── fapshi.types.ts              # Types DTO Fapshi (request/response)
│   │   │   └── fapshi-webhook.validator.ts  # Vérification signature HMAC
│   │   └── provider-factory.ts              # Sélection du provider selon config
│   │
│   ├── services/
│   │   ├── payment.service.ts               # Initiation, vérification, orchestration
│   │   ├── webhook.service.ts               # Traitement idempotent des webhooks
│   │   └── commission.service.ts            # Calcul et enregistrement des commissions
│   │
│   ├── repositories/
│   │   ├── transaction.repository.ts        # CRUD Transaction
│   │   └── commission.repository.ts         # CRUD Commission
│   │
│   ├── validators/
│   │   ├── payment.schema.ts                # Zod : initiate, verify
│   │   └── webhook.schema.ts                # Zod : webhook payload
│   │
│   ├── guards/
│   │   └── payment.guard.ts                 # Vérifications avant toute action
│   │
│   ├── policies/
│   │   └── commission.policy.ts             # Règles de calcul des commissions
│   │
│   └── types/
│       └── payment.types.ts                 # Types partagés du domaine
│
├── app/api/payments/
│   ├── initiate/route.ts                    # POST   Initier un paiement (flux principal)
│   └── webhook/fapshi/route.ts              # POST   Webhook Fapshi (flux principal)
│
├── app/api/payments/
│   └── verify/route.ts                      # GET    Secours / réconciliation (hors flux principal)
│
└── middleware/
    └── payment-rate-limit.ts                # Rate limiting routes de paiement
```

**Total :** 17 fichiers (contre 25+ dans la version précédente).

---

## 2. Modules et responsabilités

| Module | Rôle | Taille |
|--------|------|--------|
| `adapters/payment-provider.interface.ts` | Contrat universel : `IPaymentProvider` | Interface (~8 méthodes) |
| `adapters/fapshi/fapshi.adapter.ts` | Traduit les appels métier → API Fapshi. Seul point qui connaît Fapshi. | ~150 lignes |
| `adapters/fapshi/fapshi.types.ts` | DTOs Fapshi (types d'entrée/sortie) | ~40 lignes |
| `adapters/fapshi/fapshi-webhook.validator.ts` | Vérifie la signature HMAC du webhook | ~30 lignes |
| `adapters/provider-factory.ts` | Factory : retourne le bon adapter selon la config | ~20 lignes |
| `services/payment.service.ts` | Initiation, vérification statut, orchestration post-webhook | ~200 lignes |
| `services/webhook.service.ts` | Traitement idempotent du webhook, validation complète | ~120 lignes |
| `services/commission.service.ts` | Calcul, enregistrement, ventilation par enseignant | ~80 lignes |
| `repositories/transaction.repository.ts` | CRUD Transaction + recherche par clé | ~60 lignes |
| `repositories/commission.repository.ts` | CRUD Commission | ~40 lignes |
| `validators/payment.schema.ts` | Schémas Zod pour initiate + verify | ~30 lignes |
| `validators/webhook.schema.ts` | Schéma Zod pour payload webhook | ~30 lignes |
| `guards/payment.guard.ts` | Fonctions de vérification (éligibilité, propriété...) | ~80 lignes |
| `policies/commission.policy.ts` | Taux, règles, cas spéciaux | ~40 lignes |
| `types/payment.types.ts` | Types TypeScript partagés | ~50 lignes |

---

## 3. Interface `IPaymentProvider` (contrat universel)

```
IPaymentProvider
├── initiatePayment(request: InitiatePaymentRequest): Promise<InitiatePaymentResponse>
├── verifyPayment(providerTxId: string): Promise<VerifyPaymentResponse>
├── getTransactionStatus(providerTxId: string): Promise<TransactionStatusResponse>
├── validateWebhookPayload(payload: unknown): WebhookPayload
├── verifyWebhookSignature(payload: unknown, signature: string): boolean
└── getProviderName(): PaymentProviderEnum
```

**Pas de `refund`** tant que non implémenté. Ajoutable en 1 méthode quand nécessaire.

---

## 4. DTOs partagés (indépendants du provider)

```
InitiatePaymentRequest {
  amount: number              // FCFA, entier
  currency: "XAF"             // Toujours XAF
  reference: string           // order.number
  email: string               // Email de l'acheteur
  metadata: {
    orderId: string
    userId: string
    idempotencyKey: string    // Anti double-clic
  }
}

InitiatePaymentResponse {
  providerTransactionId: string
  status: "PENDING" | "FAILED"
}

VerifyPaymentResponse {
  verified: boolean
  status: "SUCCESS" | "FAILED" | "PENDING" | "EXPIRED"
  amount: number
  paidAt?: Date
}

WebhookPayload {
  providerTxId: string
  providerRef: string
  status: "SUCCESS" | "FAILED" | "EXPIRED"
  amount: number
  currency: string
  signature: string           // HMAC vérifié par le middleware
  rawPayload: unknown         // Conservé côté serveur uniquement (audit)
}

TransactionStatusResponse {
  status: "INITIATED" | "PENDING" | "SUCCESS" | "FAILED" | "EXPIRED"
  amount: number
}
```

**Règle :** `rawPayload` et `providerRawResponse` ne sont **jamais** retournés au frontend. Réservés à l'audit serveur.

---

## 5. États d'une transaction

```
INITIATED ──→ PENDING ──→ SUCCESS    (terminal)
                 │
                 ├──→ FAILED         (terminal)
                 │
                 └──→ EXPIRED        (terminal)
```

| État | Signification | Transition possible |
|------|--------------|---------------------|
| `INITIATED` | Créée localement, pas encore envoyée à Fapshi | → `PENDING`, `EXPIRED` |
| `PENDING` | Envoyée à Fapshi, attente paiement utilisateur | → `SUCCESS`, `FAILED`, `EXPIRED` |
| `SUCCESS` | Paiement confirmé | Aucune (terminal) |
| `FAILED` | Refusé par Fapshi ou l'utilisateur | Aucune (terminal) |
| `EXPIRED` | Timeout 30 min sans paiement | Aucune (terminal) |

**Pas de `REFUNDED`** tant que les remboursements n'existent pas. Le jour venu, on l'ajoutera en 1 migration.

---

## 6. États d'une commande

```
PENDING ──→ PAID      → téléchargements disponibles
  │
  ├──→ EXPIRED        (timeout sans paiement)
  │
  └──→ CANCELLED      (annulation explicite)
```

| État | Déclencheur |
|------|-----------|
| `PENDING` | Création de la commande depuis le panier |
| `PAID` | Transaction `SUCCESS` → commission créée |
| `EXPIRED` | Timeout 30 min sans paiement |
| `CANCELLED` | Annulation volontaire OU webhook `FAILED` |

---

## 7. Table Prisma `Transaction` — version enrichie

```
model Transaction {
  id              String            @id @default(uuid())
  orderId         String
  order           Order             @relation(fields: [orderId], references: [id])

  // Provider
  provider        PaymentProvider   @default(FAPSHI)
  providerTxId    String?           @unique    // ID Fapshi (clé d'idempotence webhook)
  providerRef     String?                      // Reference Fapshi

  // Montant
  amount          Decimal           @db.Decimal(10, 2)
  currency        String            @default("XAF")

  // Statut
  status          TransactionStatus @default(INITIATED)
  statusReason    String?                      // Si FAILED/EXPIRED
  paidAt          DateTime?

  // Idempotence
  idempotencyKey  String            @unique    // Anti double-clic

  // Tentatives techniques (timeout réseau, erreur 5xx Fapshi, etc.)
  // Ne s'incrémente PAS quand l'utilisateur relance volontairement →
  // dans ce cas une NOUVELLE Transaction est créée.
  // Une Transaction = une seule tentative de paiement auprès du provider.
  attempts        Int               @default(1)
  lastAttemptAt   DateTime          @default(now())
  lastErrorCode   String?
  lastErrorBody   Json?                        // Dernière erreur technique

  // Audit
  ipAddress       String?
  userAgent       String?
  callbackData    Json?                        // Payload webhook brut (serveur uniquement)

  // Timestamps
  initiatedAt     DateTime          @default(now())
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  commission      Commission?

  @@index([orderId])
  @@index([status])
  @@index([provider])
  @@index([idempotencyKey])
  @@index([providerTxId])
  @@index([status, initiatedAt])              // Pour job de timeout
  @@map("transactions")
}

// PaymentProvider enum enrichi
enum PaymentProvider {
  FAPSHI
  CAMPAY
  STRIPE
  NOTCHPAY
}
```

**Note :** Les tentatives sont stockées dans Transaction (`attempts`, `lastErrorCode`, `lastErrorBody`). Pas de table `PaymentAttempt` séparée.

---

## 8. Table `Commission` — version enrichie

```
model Commission {
  id              String    @id @default(uuid())
  transactionId   String    @unique
  transaction     Transaction @relation(fields: [transactionId], references: [id])

  rate            Decimal   @db.Decimal(5, 2)      // ex: 0.15 (configurable)
  platformAmount  Decimal   @db.Decimal(10, 2)
  teacherAmount   Decimal   @db.Decimal(10, 2)

  // Ventilation par enseignant (commande multi-vendeurs)
  examPaperId     String?                           // Épreuve concernée
  teacherId       String?                           // Enseignant bénéficiaire

  createdAt       DateTime  @default(now())

  @@index([transactionId])
  @@index([teacherId])
  @@map("commissions")
}
```

**Important :** Si une commande contient des épreuves de 3 enseignants différents, 3 commissions sont créées (une par enseignant). Chaque commission référence `examPaperId` et `teacherId`.

---

## 9. Extensions de la table `AuditLog` (existante)

On étend l'existant plutôt que de créer une table `PaymentAuditLog`.

**Nouvelles valeurs dans `AuditAction` :**
```
PAYMENT_INITIATED
PAYMENT_SUCCEEDED
PAYMENT_FAILED
PAYMENT_EXPIRED
WEBHOOK_RECEIVED
WEBHOOK_DUPLICATE
WEBHOOK_VERIFIED
WEBHOOK_SIGNATURE_INVALID
WEBHOOK_AMOUNT_MISMATCH
DOUBLE_CLICK_BLOCKED
DOUBLE_PAYMENT_BLOCKED
ORDER_OWNERSHIP_VIOLATION
COMMISSION_CALCULATED
```

---

## 10. Nouveaux index et contraintes SQL

```sql
-- Index partiel : transactions en attente (job de timeout)
CREATE INDEX idx_transactions_pending
  ON transactions (status, initiatedAt)
  WHERE status IN ('INITIATED', 'PENDING');

-- Index commissions par enseignant
CREATE INDEX idx_commissions_teacher
  ON commissions (teacherId, createdAt);

-- Contrainte : montant strictement positif
ALTER TABLE transactions
  ADD CONSTRAINT chk_amount_positive CHECK (amount > 0);

-- Contrainte : commission entre 0 et 1
ALTER TABLE commissions
  ADD CONSTRAINT chk_rate_valid CHECK (rate > 0 AND rate <= 1);
```

---

## 11. Cycle complet

```
FLUX PRINCIPAL (toujours webhook)

1. PANIER → COMMANDE → PAIEMENT → WEBHOOK → TÉLÉCHARGEMENT

2. /verify n'est PAS une étape du flux principal.
   C'est un mécanisme de secours uniquement (voir §11.6 et §18).

3. Retry après échec ou expiration = NOUVELLE Transaction.
   Une Transaction = une tentative de paiement.
```

```
1. PANIER
   ├── L'utilisateur ajoute des épreuves au panier
   │   └── CartItem(userId, examPaperId, withCorrection)
   ├── L'utilisateur clique "Commander"
   │   └── POST /api/orders/create
   └── Order créée (status: PENDING), panier vidé

2. INITIATION PAIEMENT
   ├── POST /api/payments/initiate { orderId }
   ├── [GUARD]  VéRIFICATIONS (voir §12.1)
   ├── [ATOMIC] prisma.$transaction :
   │   ├── Vérifie order.status === PENDING
   │   ├── Vérifie idempotencyKey UNIQUE
   │   ├── Vérifie aucune transaction SUCCESS pour cet orderId
   │   ├── Crée Transaction (status: INITIATED)
   │   └── AuditLog (PAYMENT_INITIATED)
   ├── [ADAPTER] FapshiAdapter.initiatePayment()
   │   └── POST https://api.fapshi.com/v1/direct-pay
   ├── [UPDATE] Transaction → PENDING, providerTxId = réponse Fapshi
   └── Retourne { status: "PENDING" } au client

3. PAIEMENT (côté Fapshi, interface Direct Pay)
   ├── L'utilisateur finalise le paiement (mobile money, carte...)
   └── Fapshi envoie un webhook

   ⚠️ SI ÉCHEC OU EXPIRATION :
   ├── Transaction → FAILED (ou EXPIRED)
   ├── L'utilisateur peut relancer → POST /api/payments/initiate
   └── Crée une NOUVELLE Transaction (n'incrémente PAS attempts sur l'ancienne)

4. WEBHOOK (flux principal de confirmation)
   ├── POST /api/payments/webhook/fapshi
   ├── [MIDDLEWARE] Vérifie signature HMAC (fapshi-webhook.validator)
   ├── [VALIDATE] Schéma Zod du payload
   ├── [LOCK VIA DB] UPDATE transaction WHERE providerTxId = X AND status = 'PENDING'
   │   └── Si 0 ligne affectée → déjà traité → 200 (idempotent)
   ├── [ATOMIC] prisma.$transaction :
   │   ├── SI status === SUCCESS :
   │   │   ├── Transaction → SUCCESS, paidAt
   │   │   ├── Order → PAID, paidAt
   │   │   ├── CommissionService.calculate(order) → 1 Commission par enseignant
   │   │   └── AuditLog (PAYMENT_SUCCEEDED, COMMISSION_CALCULATED)
   │   ├── SI status === FAILED :
   │   │   ├── Transaction → FAILED
   │   │   ├── Order → CANCELLED
   │   │   └── AuditLog (PAYMENT_FAILED)
   │   └── SI status === EXPIRED :
   │       ├── Transaction → EXPIRED
   │       ├── Order → EXPIRED
   │       └── AuditLog (PAYMENT_EXPIRED)
   ├── [EVENT] Émet événement interne (email + notification in-app, asynchrone)
   └── Réponse 200 { status: "processed" }

5. TÉLÉCHARGEMENT
   ├── GET /api/download?orderItemId=X&type=paper
   ├── [GUARD] order.status === PAID
   ├── [GUARD] order.userId === session.user.id
   ├── [GUARD] L'OrderItem existe et appartient à la commande
   ├── [GUARD] Fichier existant sur le stockage
   ├── [REPO] Download créé
   └── Fichier servi (téléchargements illimités)

6. COMMISSION
   ├── Calculée immédiatement après SUCCESS
   ├── 1 ligne Commission par couple (transaction, examPaperId, teacherId)
   ├── Rate : 15% plateforme / 85% enseignant (configurable)
   └── Payout (paiement enseignant) : job futur

7. ROUTE /verify (HORS FLUX PRINCIPAL)
   ├── GET /api/payments/verify?orderId=X
   ├── Rôle : mécanisme de secours uniquement, jamais le flux normal
   ├── Cas d'usage légitimes :
   │   ├── Webhook tarde (> 2 min) → l'utilisateur clique "Vérifier mon paiement"
   │   ├── Job de réconciliation périodique (toutes les 5 min)
   │   └── Debug/admin : vérifier l'état d'une transaction
   ├── Implémentation : appelle Fapshi GET /transaction/{id}, met à jour le statut local
   └── Ne remplace PAS le webhook. Le webhook reste la source de vérité principale.
```

---

## 12. Vérifications obligatoires

### 12.1 Avant d'initier un paiement

| Règle | Violation → HTTP |
|-------|-----------------|
| Utilisateur authentifié | 401 |
| Commande existe | 404 |
| `order.userId === session.user.id` | 403 |
| `order.status === PENDING` | 409 |
| Aucune transaction `SUCCESS` pour cette commande | 409 |
| `idempotencyKey` pas déjà utilisée | 409 |
| Rate limit : max 5 initiations/minute | 429 |

### 12.2 Avant d'accepter un webhook

| Règle | Action si violée |
|-------|-----------------|
| Signature HMAC valide | Rejeter 401, AuditLog |
| Payload conforme au schéma | Rejeter 400 |
| Commande référencée existe | Logger, répondre 200 |
| `providerTxId` pas déjà traité | Idempotent → 200 |
| Montant webhook == montant commande | Logger CRITICAL, répondre 200 |
| Devise === XAF | Logger ERROR, répondre 200 |
| Double vérification via API Fapshi GET `/transaction/{id}` | Logger si discordance |

### 12.3 Avant le téléchargement

| Règle | Violation → HTTP |
|-------|-----------------|
| `order.status === PAID` | 403 |
| `order.userId === session.user.id` | 403 |
| `OrderItem` existe et appartient à `order` | 404 |
| Fichier existant physiquement | 404 |
| **Pas de limite** de téléchargements | — |

---

## 13. Protections (sans `PaymentLock`)

### 13.1 Anti double-paiement

- **Contrainte :** `idempotencyKey` UNIQUE → une clé ne peut être utilisée qu'une fois.
- **Vérification atomique :** `prisma.$transaction` vérifie qu'aucune transaction `SUCCESS` n'existe pour cet `orderId` avant d'accepter un webhook.
- **UPDATE conditionnel :** `UPDATE transactions SET status = 'SUCCESS' WHERE providerTxId = X AND status = 'PENDING'` → si 0 ligne affectée, c'est déjà traité.

### 13.2 Anti double-clic

- **Clé idempotence générée côté client :** `init_{orderId}_{uuid}`.
- **Contrainte UNIQUE** en base → le 2e clic reçoit une erreur 409.
- **Désactivation UI :** Bouton "Payer" désactivé après le premier clic.

### 13.3 Anti double-webhook

- **Contrainte UNIQUE sur `providerTxId`** → le 2e webhook pour la même transaction échoue à l'INSERT.
- **UPDATE conditionnel :** `WHERE status = 'PENDING'` → si déjà `SUCCESS`, 0 ligne affectée → idempotent.
- **Réponse toujours 200** → Fapshi ne renvoie pas le webhook.

### 13.4 Anti replay attack

- **Signature HMAC** vérifiée par l'adapter Fapshi.
- **Timestamp check :** Rejeter si timestamp > 5 minutes.
- **`providerTxId` unique** empêche le retraitement.

### 13.5 Anti fraude

- **Montant mismatch :** Si montant webhook ≠ montant commande → AuditLog CRITICAL, pas de livraison, notification admin.
- **Double vérification :** Appeler `GET https://api.fapshi.com/v1/transaction/{id}` pour confirmer le statut.
- **Order hijacking :** Chaque endpoint vérifie `order.userId === session.user.id`.

### 13.6 Anti race condition (sans table de lock)

```sql
-- Initiation : empêche deux initiations concurrentes pour la même commande
-- Via prisma.$transaction avec isolation Serializable :

-- 1. Vérifier qu'aucune transaction PENDING n'existe
SELECT COUNT(*) FROM transactions
WHERE orderId = X AND status IN ('INITIATED', 'PENDING');

-- 2. Si count > 0 → rejeter
-- 3. Sinon → créer la transaction

-- Webhook : empêche deux webhooks concurrents
UPDATE transactions
SET status = 'SUCCESS', paidAt = NOW()
WHERE providerTxId = X AND status = 'PENDING';

-- Si rows_affected = 0 → déjà traité → idempotent 200
-- Si rows_affected = 1 → continuer le traitement
```

---

## 14. Panier → Commande → Paiement (flux détaillé)

```
┌──────────────────────────────────────────────────────────────────────┐
│ 1. CONSTITUTION DU PANIER                                             │
│    - L'utilisateur navigue le catalogue                               │
│    - Ajoute une épreuve → POST /api/cart { examPaperId, withCorrection }│
│    - Le prix est fixé à l'ajout (prix de l'épreuve dans ExamPaper)    │
│    - CartItem stocke : userId, examPaperId, withCorrection            │
│    - Si l'épreuve a un corrigé, withCorrection peut être true/false   │
└──────────────────────────────────────────────────────────────────────┘
                                    ↓
┌──────────────────────────────────────────────────────────────────────┐
│ 2. CRÉATION DE LA COMMANDE                                            │
│    - POST /api/orders/create                                          │
│    - Lecture du panier (CartItem[])                                   │
│    - Pour chaque item :                                               │
│        prix = withCorrection ? priceWithCorrection : price            │
│    - totalAmount = somme des prix                                     │
│    - Création Order (PENDING) + OrderItem[] avec snapshots            │
│    - Vidage du panier                                                 │
│    - La commande capture l'état des prix au moment de la création     │
│      (titleSnapshot, yearSnapshot, price) → immuable                  │
└──────────────────────────────────────────────────────────────────────┘
                                    ↓
┌──────────────────────────────────────────────────────────────────────┐
│ 3. PAIEMENT                                                           │
│    - POST /api/payments/initiate { orderId, idempotencyKey }         │
│    - Vérifications (voir §12.1)                                       │
│    - Appel Fapshi Direct Pay : amount = order.totalAmount             │
│    - Transaction créée (PENDING)                                      │
│    - Fapshi gère le paiement (mobile money, carte...)                 │
│    - Webhook Fapshi → traitement (voir §11.4)                         │
└──────────────────────────────────────────────────────────────────────┘
                                    ↓
┌──────────────────────────────────────────────────────────────────────┐
│ 4. TÉLÉCHARGEMENTS                                                    │
│    - GET /api/download?orderItemId=X&type=paper                       │
│    - Vérifications (voir §12.3)                                       │
│    - Téléchargements illimités                                        │
│    - Chaque téléchargement crée un Download (audit)                   │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 15. Commissions multi-vendeurs

Une commande peut contenir des épreuves de plusieurs enseignants.

```
Commande #ORD-123 (total: 4500 FCFA)
├── OrderItem 1 : Épreuve A (1500 FCFA) → Enseignant X
├── OrderItem 2 : Épreuve B (1000 FCFA) → Enseignant Y
└── OrderItem 3 : Épreuve C (2000 FCFA) → Enseignant X

Commissions créées :
├── Commission 1 : transactionId, teacherId=X, examPaperId=A
│   platformAmount=225, teacherAmount=1275
├── Commission 2 : transactionId, teacherId=Y, examPaperId=B
│   platformAmount=150, teacherAmount=850
└── Commission 3 : transactionId, teacherId=X, examPaperId=C
    platformAmount=300, teacherAmount=1700
```

**Double total :** 4500 FCFA. Plateforme : 675 FCFA. Enseignants : 3825 FCFA.

---

## 16. Architecture pour les paiements partiels (future)

Même si Fapshi ne supporte pas les paiements partiels aujourd'hui, la structure doit l'anticiper.

```
Transaction 1 → N PaymentParts

PaymentPart {
  id: string
  transactionId: string
  amount: number              // Part du montant total
  status: PaymentPartStatus   // PENDING | PAID | FAILED
  providerTxId?: string       // ID chez le provider pour cette part
  paidAt?: DateTime
}
```

**Quand le besoin arrivera :**
1. Créer la table `PaymentPart` (migration)
2. Adapter `PaymentService` pour gérer plusieurs parts
3. Chaque part peut avoir son propre `providerTxId`
4. La transaction passe à `SUCCESS` quand toutes les parts sont `PAID`

**Aujourd'hui :** Rien à coder. L'architecture le permet juste.

---

## 17. Erreurs possibles

### Initiation

| HTTP | Code | Message |
|------|------|---------|
| 401 | `AUTH_REQUIRED` | Authentification requise |
| 404 | `ORDER_NOT_FOUND` | Commande introuvable |
| 403 | `ORDER_NOT_YOURS` | Cette commande ne vous appartient pas |
| 409 | `ORDER_ALREADY_PAID` | Commande déjà payée |
| 409 | `ORDER_PROCESSING` | Paiement en cours |
| 409 | `IDEMPOTENCY_KEY_USED` | Requête déjà traitée |
| 429 | `RATE_LIMITED` | Trop de tentatives |
| 502 | `PROVIDER_ERROR` | Erreur Fapshi |
| 504 | `PROVIDER_TIMEOUT` | Fapshi ne répond pas |

### Téléchargement

| HTTP | Code | Message |
|------|------|---------|
| 403 | `ORDER_NOT_PAID` | Commande non payée |
| 403 | `ORDER_NOT_YOURS` | Pas votre commande |
| 404 | `FILE_NOT_FOUND` | Fichier introuvable |

---

## 18. Récupération après erreur

### Webhook jamais reçu

1. **Job périodique** (toutes les 5 min) : trouve les transactions `PENDING` depuis > 10 min.
2. Appelle `GET /api/payments/verify?orderId=X` → qui interroge Fapshi.
3. Réconcilie : met à jour le statut local selon le statut Fapshi.
4. Si Fapshi dit `SUCCESS` → traiter comme le ferait le webhook.
5. **Bouton utilisateur « Vérifier mon paiement »** : appel manuel à `/verify` si le statut tarde.

### Erreur réseau Fapshi (retry automatique)

1. `attempts` incrémenté dans la Transaction en cours.
2. Retry : max 3 tentatives avec backoff exponentiel (1s → 2s → 4s).
3. Après 3 échecs → Transaction `FAILED`.
4. Si l'utilisateur veut réessayer → **nouvelle** Transaction (POST `/initiate`).

### Commission non calculée après SUCCESS

1. Vérification post-webhook : si Transaction `SUCCESS` sans Commission → recalcul immédiat.
2. Job quotidien de vérification d'intégrité.

---

## 19. Idempotence (sans `PaymentLock`)

| Mécanisme | Utilisation | Implémentation |
|-----------|------------|----------------|
| `idempotencyKey` UNIQUE | Anti double-clic (initiation) | Contrainte Postgres |
| `providerTxId` UNIQUE | Anti double-webhook | Contrainte Postgres |
| UPDATE conditionnel `WHERE status = 'PENDING'` | Anti race condition webhook | Atomic update SELECT + vérification rows_affected |
| `prisma.$transaction` | Atomicité vérification + écriture | Niveau `Serializable` si nécessaire |

---

## 20. Journalisation et audit

### Logs (Pino)

| Niveau | Usage |
|--------|-------|
| `INFO` | Paiement initié, succès, webhook reçu |
| `WARN` | Retry, webhook dupliqué, rate limit |
| `ERROR` | Échec Fapshi, timeout |
| `CRITICAL` | Montant mismatch, signature invalide, fraude suspectée |

### Audit (table `AuditLog` existante)

On enrichit `AuditAction` avec les valeurs de paiement (voir §9). La table `AuditLog` existante est réutilisée — pas de deuxième système d'audit.

---

## 21. Validations

### Serveur (Zod)

- `initiatePaymentSchema` : `{ orderId: uuid, idempotencyKey: string.min(10).max(100) }`
- `webhookPayloadSchema` : `{ transId, reference, status, amount, currency, signature }`

### Client

- Bouton "Payer" désactivé après clic (`isPaying` state)
- Génération `idempotencyKey` via `crypto.randomUUID()`
- Vérification panier non vide avant commande
- Redirection `/connexion` si 401

---

## 22. Timeout et retry

| Opération | Timeout | Retry |
|-----------|---------|-------|
| Appel API Fapshi (initiation) | 15s | ×3, backoff 1s→2s→4s |
| Appel API Fapshi (vérification) | 10s | ×2, backoff 2s→5s |
| Traitement webhook | 25s | Aucun (Fapshi retry si timeout) |
| Transaction PENDING → EXPIRED | 30 min | Job périodique |
| Idempotency Key TTL | 1 heure | Recyclable après |

---

## 23. Règles de suppression

| Entité | Règle |
|--------|-------|
| `Transaction` | **Jamais supprimée** |
| `Commission` | **Jamais supprimée** |
| `Order` | **Jamais supprimée** (statuts `CANCELLED`, `EXPIRED`) |
| `PaymentAuditLog` | N/A (utilise `AuditLog` existant, rétention 3 ans) |

---

## 24. Règles d'annulation et remboursement

### Annulation

| Scénario | Action |
|----------|--------|
| Commande `PENDING` sans transaction | `Order → CANCELLED` |
| Commande `PENDING` + transaction `PENDING` | Après timeout 30 min : `Transaction → EXPIRED`, `Order → EXPIRED` |

### Remboursement (futur)

- Toujours déclenché manuellement par un admin.
- Transaction passe à `REFUNDED` (statut ajouté quand la feature arrivera).
- Commission annulée (champ `reversedAt` ajouté le moment venu).

---

## 25. Synthèse : changements vs l'existant

| Aspect | Actuel | Cible |
|--------|--------|-------|
| Provider | NotchPay, simulé | Fapshi Direct Pay, via adapter |
| Architecture | 1 fichier `notchpay.service.ts` | 17 fichiers modulaires |
| Table Transaction | 9 colonnes | ~20 colonnes (idempotence, audit, tentatives inline) |
| Tentatives | 0 | `attempts` dans Transaction (retry technique uniquement). Retry volontaire = nouvelle Transaction. |
| Commission | Calculée dans le webhook | Service dédié, 1 ligne par enseignant |
| Idempotence | Aucune | `idempotencyKey` + `providerTxId` UNIQUE |
| Race condition | Aucune protection | `prisma.$transaction` + UPDATE conditionnel |
| Audit paiement | 0 | Étend `AuditLog` existant (+13 actions) |
| Webhook | Signature non vérifiée | HMAC + timestamp + double vérification API |
| Timeout | Aucun | 30 min + job de nettoyage |
| Retry | 0 | ×3 backoff exponentiel |
| Remboursement | 0 | Structure prête, pas implémentée |

---

## 26. Prochaines étapes

1. Migrer le schéma Prisma (Transaction enrichie, Commission enrichie, AuditAction étendu)
2. Implémenter `IPaymentProvider` + `FapshiAdapter`
3. Implémenter `PaymentService`
4. Implémenter `WebhookService`
5. Implémenter `CommissionService` (multi-vendeurs)
6. Créer les routes API (`initiate`, `webhook`, `verify`)
7. Ajouter le middleware de signature webhook
8. Ajouter le rate limiting
9. Écrire les tests (unitaires + intégration)
10. Nettoyer l'ancien code NotchPay
