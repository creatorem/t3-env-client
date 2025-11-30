"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle, Plus, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const envVarSchema = z.object({
  key: z
    .string()
    .min(1, "Variable name is required")
    .regex(/^[A-Z][A-Z0-9_]*$/, "Must be uppercase with underscores"),
  value: z.string().min(0, "Value is required"),
});

type EnvVar = z.infer<typeof envVarSchema>;

interface EnvVarFormProps {
  initialVars?: Record<string, string>;
  onVarsChange?: (vars: Record<string, string>) => void;
  searchTerm?: string;
  className?: string;
}

export function EnvVarForm({
  initialVars = {},
  onVarsChange,
  searchTerm = "",
  className,
}: EnvVarFormProps) {
  const [envVars, setEnvVars] = useState<EnvVar[]>(
    Object.entries(initialVars).map(([key, value]) => ({ key, value }))
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<EnvVar>({
    resolver: zodResolver(envVarSchema),
    defaultValues: { key: "", value: "" },
  });

  const watchedValues = watch();

  const addEnvVar = (data: EnvVar) => {
    const newVars = [...envVars, data];
    setEnvVars(newVars);
    onVarsChange?.(Object.fromEntries(newVars.map((v) => [v.key, v.value])));
    reset();
  };

  const removeEnvVar = (index: number) => {
    const newVars = envVars.filter((_, i) => i !== index);
    setEnvVars(newVars);
    onVarsChange?.(Object.fromEntries(newVars.map((v) => [v.key, v.value])));
  };

  const updateEnvVar = (index: number, field: keyof EnvVar, value: string) => {
    const newVars = [...envVars];
    newVars[index] = { ...newVars[index], [field]: value };
    setEnvVars(newVars);
    onVarsChange?.(Object.fromEntries(newVars.map((v) => [v.key, v.value])));
  };

  const validateVar = (envVar: EnvVar) => {
    try {
      envVarSchema.parse(envVar);
      return true;
    } catch {
      return false;
    }
  };

  const filteredVars = envVars.filter(
    (envVar) =>
      envVar.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      envVar.value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={cn("space-y-6", className)}>
      {/* Add new variable form */}
      <form
        onSubmit={handleSubmit(addEnvVar)}
        className="space-y-4 rounded-lg border bg-gray-50 p-4"
      >
        <h3 className="font-medium text-gray-900">
          Add New Environment Variable
        </h3>

        <div className="space-y-2">
          <Label htmlFor="key">Variable Name</Label>
          <Input
            {...register("key")}
            id="key"
            placeholder="NEXT_PUBLIC_API_URL"
            className={cn(errors.key && "border-red-500")}
          />
          {errors.key && (
            <p className="flex items-center gap-1 text-sm text-red-600">
              <AlertCircle className="h-3 w-3" />
              {errors.key.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="value">Value</Label>
          <Input
            {...register("value")}
            id="value"
            placeholder="https://api.example.com"
            className={cn(errors.value && "border-red-500")}
          />
          {errors.value && (
            <p className="flex items-center gap-1 text-sm text-red-600">
              <AlertCircle className="h-3 w-3" />
              {errors.value.message}
            </p>
          )}
        </div>

        <Button type="submit" size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Variable
        </Button>
      </form>

      {/* Existing variables */}
      <div className="space-y-4">
        <h3 className="font-medium text-gray-900">
          Environment Variables ({filteredVars.length})
        </h3>

        {filteredVars.length === 0 ? (
          <p className="rounded-lg border bg-gray-50 py-8 text-center text-sm text-gray-500">
            {searchTerm
              ? "No variables match your search."
              : "No environment variables added yet."}
          </p>
        ) : (
          <div className="space-y-3">
            {filteredVars.map((envVar, index) => {
              const originalIndex = envVars.findIndex((v) => v === envVar);
              const isValid = validateVar(envVar);

              return (
                <div
                  key={`${envVar.key}-${index}`}
                  className={cn(
                    "space-y-3 rounded-lg border p-4 transition-colors",
                    isValid
                      ? "border-green-200 bg-green-50"
                      : "border-red-200 bg-red-50"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isValid ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span
                        className={cn(
                          "text-sm font-medium",
                          isValid ? "text-green-800" : "text-red-800"
                        )}
                      >
                        {isValid ? "Valid" : "Invalid"}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeEnvVar(originalIndex)}
                      className="text-red-600 hover:bg-red-100 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Variable Name</Label>
                      <Input
                        value={envVar.key}
                        onChange={(e) =>
                          updateEnvVar(originalIndex, "key", e.target.value)
                        }
                        className="font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Value</Label>
                      <Input
                        value={envVar.value}
                        onChange={(e) =>
                          updateEnvVar(originalIndex, "value", e.target.value)
                        }
                        className="font-mono text-sm"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
