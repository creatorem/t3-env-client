"use client";

import { Form } from "./form";

export const Variables = () => {
  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <h2 className="mb-6 text-xl font-semibold text-gray-900">
        Environment Variables
      </h2>
      <Form />
    </div>
  );
};
