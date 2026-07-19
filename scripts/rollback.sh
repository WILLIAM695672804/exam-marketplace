#!/usr/bin/env bash

set -Eeuo pipefail
IFS=$'\n\t'

APP_DIR="${APP_DIR:-/home/c2834043c/exam-marketplace}"
BACKUP_DIR="${BACKUP_DIR:-/home/c2834043c/backups}"

# Si un argument est fourni, il représente le nom du fichier de sauvegarde à restaurer.
# Sinon, on restaure la plus récente.
TARGET_BACKUP="${1:-}"

log() {
    printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$1"
}

error() {
    printf '[%s] ERROR: %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$1" >&2
}

check_requirements() {
    local commands=(tar find)
    for cmd in "${commands[@]}"; do
        if ! command -v "$cmd" >/dev/null 2>&1; then
            error "Commande introuvable : $cmd"
            exit 1
        fi
    done
}

select_backup() {
    if [ -n "$TARGET_BACKUP" ]; then
        # Vérification que le fichier demandé existe bien
        if [ ! -f "$BACKUP_DIR/$TARGET_BACKUP" ]; then
            error "Sauvegarde spécifiée introuvable : $BACKUP_DIR/$TARGET_BACKUP"
            exit 1
        fi
        SELECTED_BACKUP="$BACKUP_DIR/$TARGET_BACKUP"
        log "Sauvegarde demandée : $SELECTED_BACKUP"
    else
        # Recherche automatique de la plus récente
        SELECTED_BACKUP=$(
            find "$BACKUP_DIR" \
                -maxdepth 1 \
                -name "backup-*.tar.gz" \
                -type f \
                -printf "%T@ %p\n" \
                | sort -rn \
                | head -n 1 \
                | cut -d' ' -f2-
        )
        if [ -z "${SELECTED_BACKUP:-}" ]; then
            error "Aucune sauvegarde disponible dans $BACKUP_DIR."
            exit 1
        fi
        log "Sauvegarde la plus récente : $SELECTED_BACKUP"
    fi
}

restore_backup() {
    log "Suppression de l'application actuelle"
    rm -rf "$APP_DIR"
    mkdir -p "$(dirname "$APP_DIR")"

    log "Restauration de la sauvegarde"
    tar -xzf "$SELECTED_BACKUP" -C "$(dirname "$APP_DIR")"
}

restart_passenger() {
    log "Redémarrage de Passenger"
    mkdir -p "$APP_DIR/tmp"
    touch "$APP_DIR/tmp/restart.txt"
}

verify_restore() {
    if [ ! -f "$APP_DIR/package.json" ]; then
        error "La restauration semble incomplète : package.json introuvable."
        exit 1
    fi
    if [ ! -d "$APP_DIR/node_modules" ]; then
        error "La restauration semble incomplète : node_modules absent."
        exit 1
    fi
    log "Restauration vérifiée."
}

main() {
    log "Début du rollback"
    check_requirements
    select_backup
    restore_backup
    verify_restore
    restart_passenger
    log "Rollback terminé avec succès"
}

main "$@"