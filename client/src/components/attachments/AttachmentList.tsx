import { api } from '../../lib/api';
import { RoomAttachment } from '../../types/api';

type AttachmentListProps = {
  roomId: string | null;
  attachments: RoomAttachment[];
  isLoading: boolean;
  canView: boolean;
};

function formatSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }

  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}

export function AttachmentList({
  roomId,
  attachments,
  isLoading,
  canView,
}: AttachmentListProps) {
  if (!roomId) {
    return null;
  }

  if (!canView) {
    return (
      <section className="attachment-panel">
        <p className="eyebrow">Attachments</p>
        <p className="muted-copy">Join this room to view shared files.</p>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="attachment-panel">
        <p className="eyebrow">Attachments</p>
        <p className="muted-copy">Loading attachments...</p>
      </section>
    );
  }

  return (
    <section className="attachment-panel">
      <div className="panel__header">
        <h3>Attachments</h3>
        <span className="pill">{attachments.length}</span>
      </div>

      {attachments.length === 0 ? (
        <p className="muted-copy">No files uploaded yet.</p>
      ) : (
        <div className="attachment-list">
          {attachments.map((attachment) => (
            <article key={attachment.id} className="attachment-card">
              <div className="attachment-card__header">
                <strong>{attachment.originalName}</strong>
                <small>{formatSize(attachment.sizeBytes)}</small>
              </div>
              <small>
                by {attachment.uploadedBy.username} ·{' '}
                {new Date(attachment.createdAt).toLocaleString()}
              </small>
              {attachment.comment ? <p>{attachment.comment}</p> : null}
              <a
                className="button"
                href={api.getRoomAttachmentDownloadUrl(roomId, attachment.id)}
              >
                Download
              </a>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
