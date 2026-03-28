import { FormEvent, useState } from 'react';

type AttachmentUploaderProps = {
  canUpload: boolean;
  isUploading: boolean;
  onUpload: (file: File, comment?: string) => Promise<void>;
};

export function AttachmentUploader({
  canUpload,
  isUploading,
  onUpload,
}: AttachmentUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [comment, setComment] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedFile) {
      return;
    }

    await onUpload(selectedFile, comment.trim() || undefined);
    setSelectedFile(null);
    setComment('');
  };

  return (
    <form className="attachment-uploader" onSubmit={handleSubmit}>
      <label className="field">
        <span>File or image</span>
        <input
          type="file"
          onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
          disabled={!canUpload || isUploading}
        />
      </label>

      <label className="field">
        <span>Comment (optional)</span>
        <input
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Add context for this file"
          maxLength={240}
          disabled={!canUpload || isUploading}
        />
      </label>

      <div className="attachment-uploader__actions">
        <small>
          Limits: files up to 20 MB, images up to 3 MB. Storage is local filesystem.
        </small>
        <button
          className="button button--primary"
          type="submit"
          disabled={!canUpload || isUploading || !selectedFile}
        >
          {isUploading ? 'Uploading...' : 'Upload'}
        </button>
      </div>
    </form>
  );
}
