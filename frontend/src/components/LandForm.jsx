import { useState } from "react";

function LandForm({ polygon, onSubmit, onCancel, loading }) {
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [contact, setContact] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    if (!polygon) {
      return;
    }

    const payload = {
      price: Number(price),
      description,
      contact,
      geometry: polygon,
    };

    const success = await onSubmit(payload);

    if (success) {
      setPrice("");
      setDescription("");
      setContact("");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="price"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Price
        </label>

        <input
          id="price"
          type="number"
          min="0.01"
          step="0.01"
          required
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          className="
            w-full
            rounded-lg
            border
            border-slate-300
            px-3
            py-2
            outline-none
            focus:border-slate-600
          "
          placeholder="250000.00"
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Description
        </label>

        <textarea
          id="description"
          required
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={4}
          className="
            w-full
            resize-none
            rounded-lg
            border
            border-slate-300
            px-3
            py-2
            outline-none
            focus:border-slate-600
          "
          placeholder="Describe the land"
        />
      </div>

      <div>
        <label
          htmlFor="contact"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Contact
        </label>

        <input
          id="contact"
          type="text"
          required
          value={contact}
          onChange={(event) => setContact(event.target.value)}
          className="
            w-full
            rounded-lg
            border
            border-slate-300
            px-3
            py-2
            outline-none
            focus:border-slate-600
          "
          placeholder="owner@example.com"
        />
      </div>

      {!polygon && (
        <div
          className="
            rounded-lg
            bg-amber-50
            p-3
            text-sm
            text-amber-800
          "
        >
          Draw a polygon on the map before submitting the land.
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!polygon || loading}
          className="
            flex-1
            rounded-lg
            bg-slate-900
            px-4
            py-2
            font-medium
            text-white
            transition
            hover:bg-slate-700
            disabled:cursor-not-allowed
            disabled:opacity-40
          "
        >
          {loading ? "Saving..." : "Register land"}
        </button>

        <button
          type="button"
          onClick={onCancel}
          className="
            rounded-lg
            border
            border-slate-300
            px-4
            py-2
            text-slate-700
            transition
            hover:bg-slate-100
          "
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default LandForm;
