"use client";

import { Form } from "./form";

export const Variables = () => {
  return (
    <div className="py-4 relative">
      <h2 className="absolute top-3 -translate-y-full text-md font-semibold text-foreground">
        Variables
      </h2>
      <div className="rounded-lg border">
        <Form />
      </div>
    </div>
  );
};
