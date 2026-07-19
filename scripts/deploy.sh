#!/usr/bin/env bash

set -Eeuo pipefail
IFS=$'\n\t'

# Activer l'environnement Node.js de LWS
set +u
source ~/nodevenv/exam-marketplace/22/bin/activate
set -u

# -------------------------------------------------------------------
# RÉPERTOIRE DU SCRIPT (permet de trouver l'archive où qu'on soit)
# -------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ARCHIVE_PATH="$SCRIPT_DIR/../deploy.tar.gz"

# Chemins configurables
APP_DIR="${APP_DIR:-/home/c2834043c/exam-marketplace}"
BACKUP_DIR="${BACKUP_DIR:-/home/c2834043c/backups}"
TMP_DIR="${TMP_DIR:-/home/c2834043c/deploy_tmp}"

KEEP_BACKUPS=5
TIMESTAMP="$(date '+%Y%m%d-%H%M%S')"

# -------------------------------------------------------------------
# JOURNALISATION
# -------------------------------------------------------------------
log() {
    printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$1"
}

error() {
    printf '[%s] ERROR: %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$1" >&2
}

# -------------------------------------------------------------------
# NETTOYAGE AUTOMATIQUE
# -------------------------------------------------------------------
cleanup() {
    rm -rf "$TMP_DIR"
}
trap cleanup EXIT

# -------------------------------------------------------------------
# VÉRIFICATION DES PRÉREQUIS
# -------------------------------------------------------------------
check_requirements() {
    local commands=(node npm npx tar rsync)

    for cmd in "${commands[@]}"; do
        if ! command -v "$cmd" >/dev/null 2>&1; then
            error "Commande introuvable : $cmd"
            exit 1
        fi
    done
}

# -------------------------------------------------------------------
# VÉRIFICATION DE L'ARCHIVE
# -------------------------------------------------------------------
check_archive() {
    if [ ! -f "$ARCHIVE_PATH" ]; then
        error "Archive introuvable : $ARCHIVE_PATH"
        exit 1
    fi

    if ! tar -tzf "$ARCHIVE_PATH" >/dev/null 2>&1; then
        error "Archive corrompue ou illisible"
        exit 1
    fi
}

# -------------------------------------------------------------------
# CRÉATION DES DOSSIERS
# -------------------------------------------------------------------
prepare_directories() {
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$TMP_DIR"
    mkdir -p "$APP_DIR"
}

# -------------------------------------------------------------------
# SAUVEGARDE DE L'APPLICATION ACTUELLE
# -------------------------------------------------------------------
create_backup() {
    log "Création de la sauvegarde (node_modules inclus)"

    if [ -d "$APP_DIR" ]; then
        tar -czf \
            "$BACKUP_DIR/backup-$TIMESTAMP.tar.gz" \
            --exclude='.git' \
            --exclude='logs' \
            --exclude='tmp' \
            --exclude='.next/cache' \
            -C "$(dirname "$APP_DIR")" \
            "$(basename "$APP_DIR")"
    fi
}

# -------------------------------------------------------------------
# ROTATION DES SAUVEGARDES (conserve les N plus récentes)
# -------------------------------------------------------------------
rotate_backups() {
    log "Rotation des sauvegardes"

    find "$BACKUP_DIR" \
        -maxdepth 1 \
        -name "backup-*.tar.gz" \
        -type f \
        -printf "%T@ %p\n" \
        | sort -rn \
        | tail -n +"$((KEEP_BACKUPS + 1))" \
        | cut -d' ' -f2- \
        | xargs -r rm -f
}

# -------------------------------------------------------------------
# EXTRACTION DE L'ARCHIVE
# -------------------------------------------------------------------
extract_archive() {
    log "Extraction de l'archive vers $TMP_DIR"
    rm -rf "$TMP_DIR"
    mkdir -p "$TMP_DIR"
    tar -xzf "$ARCHIVE_PATH" -C "$TMP_DIR"
}

# -------------------------------------------------------------------
# INSTALLATION DES DÉPENDANCES DE PRODUCTION
# -------------------------------------------------------------------
install_dependencies() {
    log "Installation des dépendances de production"
    cd "$TMP_DIR"

    if [ ! -f package.json ]; then
        error "package.json introuvable dans l'archive"
        exit 1
    fi

    if [ ! -f package-lock.json ]; then
        error "package-lock.json introuvable dans l'archive"
        exit 1
    fi

    npm ci --omit=dev --prefer-offline --no-audit --no-fund --ignore-scripts

    if [ ! -d node_modules ]; then
        error "Échec de l'installation des dépendances (node_modules absent)"
        exit 1
    fi
}

# -------------------------------------------------------------------
# GÉNÉRATION DU CLIENT PRISMA ET MIGRATIONS
# -------------------------------------------------------------------
run_prisma() {
    log "Génération du client Prisma"
    cd "$TMP_DIR"

    if [ ! -f prisma/schema.prisma ]; then
        error "Schéma Prisma introuvable dans l'archive"
        exit 1
    fi

    # Vérification que la CLI Prisma est disponible (doit être dans dependencies)
    if ! npx prisma --version >/dev/null 2>&1; then
        error "La CLI Prisma n'est pas disponible. Ajoutez 'prisma' dans les dependencies de package.json."
        exit 1
    fi

    # Charger les variables d'environnement depuis le .env de production
    if [ -f "$APP_DIR/.env" ]; then
        set -a
        source "$APP_DIR/.env"
        set +a
    else
        error "Fichier .env introuvable : $APP_DIR/.env"
        exit 1
    fi

    if [ -z "${DATABASE_URL:-}" ]; then
        error "DATABASE_URL n'est pas definie"
        exit 1
    fi

    echo "DATABASE_URL chargee : ${DATABASE_URL%%:*}://****"

    npx prisma generate

    if [ ! -d node_modules/.prisma ]; then
        error "Le client Prisma n'a pas été généré correctement"
        exit 1
    fi

    if [ -d prisma/migrations ]; then
        log "Application des migrations Prisma"
        npx prisma migrate deploy
    else
        log "Aucune migration trouvée, étape ignorée"
    fi
}

# -------------------------------------------------------------------
# DÉPLOIEMENT DES FICHIERS VERS LE RÉPERTOIRE DE PRODUCTION
# -------------------------------------------------------------------
deploy_files() {
    log "Déploiement des fichiers vers $APP_DIR"

    # IMPORTANT : node_modules est inclus car fraîchement construit
    # (exclusions inutiles retirées)
    rsync -a \
        --delete-after \
        --exclude=.next/cache \
        --exclude=.env \
        "$TMP_DIR"/ "$APP_DIR"/

    # Nettoyage du cache Next.js
    rm -rf "$APP_DIR/.next/cache"

    # Vérifications post-déploiement
    if [ ! -f "$APP_DIR/package.json" ]; then
        error "Déploiement incomplet : package.json introuvable dans $APP_DIR"
        exit 1
    fi

    if [ ! -d "$APP_DIR/.next" ]; then
        error "Déploiement incomplet : dossier .next absent dans $APP_DIR"
        exit 1
    fi
}

# -------------------------------------------------------------------
# REDÉMARRAGE DE PASSENGER
# -------------------------------------------------------------------
restart_passenger() {
    log "Redémarrage de l'application via Passenger"
    mkdir -p "$APP_DIR/tmp"
    touch "$APP_DIR/tmp/restart.txt"
}

# -------------------------------------------------------------------
# NETTOYAGE FINAL
# -------------------------------------------------------------------
post_cleanup() {
    log "Nettoyage final"
    rm -f "$ARCHIVE_PATH"
    rm -rf "$TMP_DIR"
}

# -------------------------------------------------------------------
# FONCTION PRINCIPALE
# -------------------------------------------------------------------
main() {
    log "Début du déploiement"

    check_requirements
    check_archive
    prepare_directories
    create_backup
    rotate_backups
    extract_archive
    install_dependencies
    run_prisma
    deploy_files
    restart_passenger
    post_cleanup

    log "Déploiement terminé avec succès"
}

main "$@"