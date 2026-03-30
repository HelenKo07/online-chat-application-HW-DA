import { api } from '../../lib/api';
import { DirectAttachment } from '../../types/api';

type DirectAttachmentListProps = {
  friendId: string | null;
  attachments: DirectAttachment[];
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

export function DirectAttachmentList({
  friendId,
  attachments,
  isLoading,
  canView,
}: DirectAttachmentListProps) {
  if (!friendId) {
    return null;
  }

  if (!canView) {
    return (
      <section className="attachment-panel">
        <p className="eyebrow">Direct attachments</p>
        <p className="muted-copy">Select a friend to view shared files.</p>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="attachment-panel">
        <p className="eyebrow">Direct attachments</p>
        <p className="muted-copy">Loading attachments...</p>
      </section>
    );
  }

  return (
    <section className="attachment-panel">
      <div className="panel__header">
        <h3>Direct attachments</h3>
        <span className="pill">{attachments.length}</span>
      </div>

      {attachments.length === 0 ? (
        <p className="muted-copy">No files in this direct chat yet.</p>
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
                href={api.getDirectAttachmentDownloadUrl(friendId, attachment.id)}
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
