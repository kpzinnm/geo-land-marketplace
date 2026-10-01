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
    <form onSubmit={handleSubmit} className="space-y-5" aria-busy={loading}>
      <div role="status" className={`rounded-xl border px-4 py-3 ${polygon ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50"}`}>
        <p className={`text-sm font-medium ${polygon ? "text-emerald-800" : "text-slate-700"}`}>
          {polygon ? "Land boundary ready" : "Draw the land boundary first"}
        </p>
        <p className="mt-1 text-xs leading-5 text-slate-600">
          {polygon ? "The polygon is ready to be registered." : "Use the map to define the parcel before submitting the form."}
        </p>
      </div>

      <Field id="price" label="Price" hint="Total asking price in BRL">
        <input id="price" aria-describedby="price-hint" type="number" min="0.01" step="0.01" required
          value={price} onChange={(event) => setPrice(event.target.value)}
          className={inputClassName} placeholder="250000.00" />
      </Field>
      <Field id="description" label="Description" hint="Briefly describe the land">
        <textarea id="description" aria-describedby="description-hint" rows={4} required
          value={description} onChange={(event) => setDescription(event.target.value)}
          className={inputClassName} placeholder="Residential land near downtown..." />
      </Field>
      <Field id="contact" label="Contact" hint="Email, phone number or another contact channel">
        <input id="contact" aria-describedby="contact-hint" type="text" required
          value={contact} onChange={(event) => setContact(event.target.value)}
          className={inputClassName} placeholder="owner@example.com" />
      </Field>

      <div className="flex flex-col gap-2 pt-2 sm:flex-row-reverse">
        <button type="submit" disabled={!polygon || loading} className="min-h-11 flex-1 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none">
          {loading ? "Registering..." : "Register land"}
        </button>
        <button type="button" onClick={onCancel} disabled={loading} className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:opacity-50">
          Cancel
        </button>
      </div>
    </form>
  );
}

const inputClassName = "w-full min-h-11 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100";

function Field({ id, label, hint, children }) {
  return (
    <div>
      <div className="mb-2">
        <label htmlFor={id} className="text-sm font-medium text-slate-800">{label}</label>
        <p id={`${id}-hint`} className="mt-0.5 text-xs text-slate-500">{hint}</p>
      </div>
      {children}
    </div>
  );
}

export default LandForm;
