from sqlalchemy.orm import Session

from .models import AuditLog


def write_audit(
    db: Session,
    actor_id: str,
    action: str,
    entity: str,
    entity_id: str | int,
    before: dict | None = None,
    after: dict | None = None,
) -> None:
    """Append-only audit entry. Every price-affecting change goes through here —
    no exceptions (CLAUDE.md §5)."""
    db.add(
        AuditLog(
            actor_id=str(actor_id),
            action=action,
            entity=entity,
            entity_id=str(entity_id),
            before_json=before,
            after_json=after,
        )
    )
