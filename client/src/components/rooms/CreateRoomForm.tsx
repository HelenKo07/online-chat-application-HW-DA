import { FormEvent, useState } from 'react';
import { CreateRoomState } from '../../types/api';

type CreateRoomFormProps = {
  onSubmit: (payload: CreateRoomState) => Promise<void>;
  isSubmitting: boolean;
};

const initialState: CreateRoomState = {
  name: '',
  description: '',
  visibility: 'PUBLIC',
};

export function CreateRoomForm({ onSubmit, isSubmitting }: CreateRoomFormProps) {
  const [form, setForm] = useState<CreateRoomState>(initialState);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit(form);
    setForm(initialState);
  };

  return (
    <form className="panel create-room" onSubmit={handleSubmit}>
      <div className="panel__header">
        <h3>Create room</h3>
        <span className="pill">Stage 3</span>
      </div>

      <label className="field">
        <span>Name</span>
        <input
          type="text"
          value={form.name}
          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          placeholder="Frontend guild"
          minLength={3}
          maxLength={48}
          required
        />
      </label>

      <label className="field">
        <span>Description</span>
        <textarea
          rows={4}
          value={form.description}
          onChange={(event) =>
            setForm((current) => ({ ...current, description: event.target.value }))
          }
          placeholder="What is this room for?"
          minLength={5}
          maxLength={240}
          required
        />
      </label>

      <label className="field">
        <span>Visibility</span>
        <select
          value={form.visibility}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              visibility: event.target.value as CreateRoomState['visibility'],
            }))
          }
        >
          <option value="PUBLIC">Public</option>
          <option value="PRIVATE">Private</option>
        </select>
      </label>

      <button className="button button--primary button--full" type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : 'Create room'}
      </button>
    </form>
  );
}
