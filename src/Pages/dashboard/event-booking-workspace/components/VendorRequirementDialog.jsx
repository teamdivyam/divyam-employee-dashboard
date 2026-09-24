/* eslint-disable react/prop-types */
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Clock, ImageIcon, Loader2, Plus, Store } from "lucide-react";

import AdminService from "../../../../services/event-booking-workspace.service";
import { Button } from "@components/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@components/components/ui/dialog";
import { Input } from "@components/components/ui/input";
import { Label } from "@components/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/components/ui/select";
import { Textarea } from "@components/components/ui/textarea";

const initialForm = {
  title: "",
  category: "",
  vendor: "",
  quantity: "",
  unit: "Sets",
  likes: "",
  notes: "",
  appliesToFunctionIds: [],
  deliveryAt: "",
  returnAt: "",
  coordinator: "",
};
const categories = [
  "Decor",
  "Furniture",
  "Lighting",
  "Flooring",
  "Linen & Fabric",
  "Catering",
  "Hospitality",
  "Transport",
  "Entertainment",
  "Other",
];
const units = ["Sets", "pcs", "set", "mtr", "pax", "kg", "sq ft", "lot"];
const idOf = (value) => String(value?._id || value || "");

const localDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (number) => String(number).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

function Field({ label, name, required, error, children, className = "" }) {
  return (
    <div className={`min-w-0 space-y-1.5 ${className}`}>
      <Label
        htmlFor={`vendor-requirement-${name}`}
        className="text-xs font-semibold"
      >
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </Label>
      {children}
      {error && (
        <p
          id={`vendor-requirement-${name}-error`}
          role="alert"
          className="text-xs text-destructive"
        >
          {error}
        </p>
      )}
    </div>
  );
}

function Section({ number, title, description, children }) {
  return (
    <section className="rounded-lg border border-border bg-card">
      <div className="flex items-center gap-3 rounded-t-lg bg-muted/40 px-4 py-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-200 text-sm font-bold text-slate-900 dark:bg-slate-700 dark:text-slate-50">
          {number}
        </span>
        <div>
          <h3 className="text-base font-semibold">{title}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export default function VendorRequirementDialog({
  eventId,
  open,
  onOpenChange,
  onSubmit,
  isSaving = false,
  mode = "add",
  preference = null,
  initialRequirement = null,
  eventFunctions = [],
  coordinators = [],
}) {
  const [form, setForm] = useState(initialForm);
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [errors, setErrors] = useState({});
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [returnRequired, setReturnRequired] = useState(false);
  const inputRef = useRef(null);
  const existingImage =
    preference?.image ||
    preference?.imageUrl ||
    initialRequirement?.itemImage ||
    "";
  const displayImage = previewUrl || existingImage;

  useEffect(() => {
    if (!open) return;
    const preferenceFunctionId = idOf(preference?.functionAppliesTo);
    const requirementFunctions = (initialRequirement?.appliesToFunctions || [])
      .map(idOf)
      .filter(Boolean);
    const vendor =
      typeof initialRequirement?.vendor === "object"
        ? initialRequirement.vendor
        : typeof preference?.vendor === "object"
          ? preference.vendor
          : null;
    setForm({
      ...initialForm,
      title:
        preference?.preferenceTitle ||
        preference?.title ||
        initialRequirement?.itemName ||
        "",
      category:
        preference?.preferenceCategory ||
        preference?.category ||
        initialRequirement?.category ||
        "",
      vendor: idOf(initialRequirement?.vendor) || idOf(preference?.vendor),
      quantity: String(
        preference?.quantity || initialRequirement?.requiredQuantity || "",
      ),
      unit: preference?.unit || initialRequirement?.unitLabel || "Sets",
      likes:
        preference?.clientLikes ||
        preference?.likes ||
        initialRequirement?.notes ||
        "",
      notes: preference?.notes || "",
      appliesToFunctionIds: requirementFunctions.length
        ? requirementFunctions
        : [preferenceFunctionId].filter(Boolean),
      deliveryAt: localDateTime(
        initialRequirement?.dispatchAt || preference?.deliveryAt,
      ),
      returnAt: localDateTime(
        initialRequirement?.returnAt || preference?.returnAt,
      ),
      coordinator: idOf(
        initialRequirement?.coordinator || preference?.coordinator,
      ),
    });
    setSelectedVendor(vendor);
    setReturnRequired(
      Boolean(initialRequirement?.returnAt || preference?.returnAt),
    );
    setImageFile(null);
    setErrors({});
  }, [open, preference, initialRequirement]);

  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl("");
      return undefined;
    }
    const url = URL.createObjectURL(imageFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const vendorsQuery = useQuery({
    queryKey: ["vendor-requirement-vendors", eventId],
    queryFn: async () =>
      (await AdminService.getVendors({ eventId, page: 1, limit: 100 })).data,
    enabled: open && Boolean(eventId),
  });
  const vendors = useMemo(
    () =>
      vendorsQuery.data?.vendors ||
      vendorsQuery.data?.vendor ||
      vendorsQuery.data?.data?.vendors ||
      [],
    [vendorsQuery.data],
  );
  const vendorOptions = useMemo(
    () =>
      selectedVendor &&
      !vendors.some((vendor) => idOf(vendor) === idOf(selectedVendor))
        ? [selectedVendor, ...vendors]
        : vendors,
    [selectedVendor, vendors],
  );

  const update = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({
      ...current,
      [name]: undefined,
      form: undefined,
    }));
  };
  const datePart = (value, part) =>
    value ? (part === "date" ? value.slice(0, 10) : value.slice(11, 16)) : "";
  const updateDateTime = (name, part, value) => {
    const date = part === "date" ? value : datePart(form[name], "date");
    const time = part === "time" ? value : datePart(form[name], "time");
    update(name, date ? `${date}T${time || "00:00"}` : "");
  };
  const toggleFunction = (value) =>
    update(
      "appliesToFunctionIds",
      form.appliesToFunctionIds.includes(value)
        ? form.appliesToFunctionIds.filter((id) => id !== value)
        : [...form.appliesToFunctionIds, value],
    );
  const chooseImage = (file) => {
    if (!file || isSaving) return;
    const error = !["image/jpeg", "image/png"].includes(file.type)
      ? "Use a JPG or PNG image"
      : file.size > 5 * 1024 * 1024
        ? "Image must be 5 MB or smaller"
        : "";
    setErrors((current) => ({ ...current, image: error }));
    if (!error) setImageFile(file);
    if (inputRef.current) inputRef.current.value = "";
  };

  const submit = (event) => {
    event.preventDefault();
    if (isSaving || !onSubmit) return;
    const nextErrors = {};
    if (!form.title.trim()) nextErrors.title = "Item Name is required";
    if (!form.category) nextErrors.category = "Category is required";
    if (!form.vendor) nextErrors.vendor = "Vendor is required";
    if (!Number.isFinite(Number(form.quantity)) || Number(form.quantity) < 1)
      nextErrors.quantity = "Required Quantity must be at least 1";
    if (!form.appliesToFunctionIds.length)
      nextErrors.appliesToFunctionIds = "Select at least one function";
    if (!form.deliveryAt || !datePart(form.deliveryAt, "time"))
      nextErrors.deliveryAt = "Delivery date and time are required";
    if (returnRequired && (!form.returnAt || !datePart(form.returnAt, "time")))
      nextErrors.returnAt = "Return date and time are required";
    if (
      returnRequired &&
      form.deliveryAt &&
      form.returnAt &&
      new Date(form.returnAt) < new Date(form.deliveryAt)
    )
      nextErrors.returnAt = "Return must be after delivery";
    if (!imageFile && !existingImage)
      nextErrors.image = "Reference Image is required";
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    const firstFunction = eventFunctions.find(
      (item) => idOf(item) === form.appliesToFunctionIds[0],
    );
    const data = new FormData();
    // Current event-preference API fields.
    data.set("preferenceTitle", form.title.trim());
    data.set("functionAppliesTo", form.appliesToFunctionIds[0]);
    data.set("preferenceCategory", form.category);
    data.set("status", preference?.status || "Final Preference");
    data.set("source", preference?.source || "Team Reference");
    data.set(
      "clientLikes",
      form.likes.trim() || `Vendor requirement for ${form.title.trim()}`,
    );
    data.set("avoid", preference?.avoid || "");
    data.set("notes", form.notes.trim());
    if (imageFile) data.set("image", imageFile);
    else if (existingImage) data.set("image", existingImage);
    // Inventory fields retained for the linked requirement mutation.
    data.set("title", form.title.trim());
    data.set("functionName", firstFunction?.name || "");
    data.set("category", form.category);
    data.set("likes", form.likes.trim());
    data.set("quantity", String(Number(form.quantity)));
    data.set("unit", form.unit);
    data.set("vendor", form.vendor);
    data.set("appliesToFunctionIds", form.appliesToFunctionIds.join(","));
    data.set("deliveryAt", form.deliveryAt);
    data.set("returnAt", returnRequired ? form.returnAt : "");
    data.set("coordinator", form.coordinator);
    onSubmit(data);
  };

  const inputProps = (name) => ({
    id: `vendor-requirement-${name}`,
    disabled: isSaving,
    "aria-invalid": Boolean(errors[name]),
    "aria-describedby": errors[name]
      ? `vendor-requirement-${name}-error`
      : undefined,
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => !isSaving && onOpenChange(value)}
    >
      <DialogContent className="flex h-[92dvh] max-h-[92dvh] w-[calc(100vw-1.5rem)] max-w-7xl flex-col gap-0 overflow-hidden p-0 sm:rounded-xl">
        <DialogHeader className="shrink-0 px-5 py-4 pr-12 text-left">
          <DialogTitle className="text-2xl font-semibold">
            {mode === "edit"
              ? "Edit Vendor Requirement"
              : "Add Vendor Requirement"}
          </DialogTitle>
          <DialogDescription>
            Create an inventory requirement for a vendor.
          </DialogDescription>
        </DialogHeader>
        <form
          id="vendor-requirement-form"
          onSubmit={submit}
          className="min-h-0 flex-1 overflow-y-auto"
        >
          <fieldset disabled={isSaving} className="space-y-3 px-5 pb-4">
            <Section
              number="1"
              title="Item Details"
              description="Select the item, category and vendor for this requirement."
            >
              <div className="grid gap-4 lg:grid-cols-[236px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.1fr)]">
                <Field
                  name="image"
                  label="Reference Image"
                  required
                  error={errors.image}
                >
                  <input
                    ref={inputRef}
                    type="file"
                    accept="image/jpeg,image/png"
                    className="sr-only"
                    onChange={(event) => chooseImage(event.target.files?.[0])}
                  />
                  <button
                    {...inputProps("image")}
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault();
                      chooseImage(event.dataTransfer.files?.[0]);
                    }}
                    className="grid h-34 min-h-34 w-full place-items-center overflow-hidden rounded-md border border-dashed bg-muted/20 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {displayImage ? (
                      <img
                        src={displayImage}
                        alt="Reference preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span>
                        <ImageIcon className="mx-auto mb-2 h-7 w-7" />
                        <span className="block text-sm font-semibold">
                          Click to upload
                        </span>
                        <span className="mt-1 block text-xs text-muted-foreground">
                          JPG, PNG (Max 5 MB)
                        </span>
                      </span>
                    )}
                  </button>
                </Field>
                <Field
                  name="title"
                  label="Item Name"
                  required
                  error={errors.title}
                >
                  <Input
                    {...inputProps("title")}
                    value={form.title}
                    maxLength={100}
                    onChange={(event) => update("title", event.target.value)}
                    placeholder="e.g. Floral Stand"
                    className="h-10 text-xs"
                  />
                </Field>
                <Field
                  name="category"
                  label="Category"
                  required
                  error={errors.category}
                >
                  <Select
                    value={form.category}
                    onValueChange={(value) => update("category", value)}
                  >
                    <SelectTrigger
                      {...inputProps("category")}
                      className="h-10 text-xs"
                    >
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((value) => (
                        <SelectItem key={value} value={value}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <div className="space-y-3">
                  <Field
                    name="vendor"
                    label="Vendor"
                    required
                    error={errors.vendor}
                  >
                    <Select
                      value={form.vendor || "none"}
                      onValueChange={(value) => {
                        const vendorId = value === "none" ? "" : value;
                        update("vendor", vendorId);
                        setSelectedVendor(
                          vendorOptions.find(
                            (item) => idOf(item) === vendorId,
                          ) || null,
                        );
                      }}
                    >
                      <SelectTrigger
                        {...inputProps("vendor")}
                        className="h-10 text-xs"
                      >
                        <SelectValue
                          placeholder={
                            vendorsQuery.isFetching
                              ? "Loading vendors..."
                              : "Select Vendor"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Select Vendor</SelectItem>
                        {vendorOptions.map((vendor) => (
                          <SelectItem key={idOf(vendor)} value={idOf(vendor)}>
                            {vendor.companyName || vendor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <div className="rounded-md bg-blue-50 p-3 text-xs text-blue-950 dark:bg-blue-950/30 dark:text-blue-100">
                    <div className="flex gap-2">
                      <Store className="h-5 w-5 shrink-0 text-blue-800 dark:text-blue-300" />
                      <div>
                        <p className="font-semibold">
                          {selectedVendor?.companyName ||
                            selectedVendor?.name ||
                            "Vendor details will appear here"}
                        </p>
                        <p className="mt-0.5 text-muted-foreground">
                          {selectedVendor
                            ? `${selectedVendor.contactPerson || "Contact"} · ${selectedVendor.mobileNumber || "No phone"}`
                            : "Select a vendor to view contact details."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Section>

            <Section
              number="2"
              title="Requirement Details"
              description="Add required quantity and function details."
            >
              <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr_1fr]">
                <Field
                  name="appliesToFunctionIds"
                  label="Applies To (Function)"
                  required
                  error={errors.appliesToFunctionIds}
                >
                  <div className="flex min-h-10 flex-wrap gap-2 rounded-md border p-2">
                    {eventFunctions.map((item) => {
                      const id = idOf(item);
                      const selected = form.appliesToFunctionIds.includes(id);
                      return (
                        <button
                          type="button"
                          key={id}
                          onClick={() => toggleFunction(id)}
                          className={`rounded px-2 py-1 text-xs ${selected ? "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-200" : "bg-muted text-muted-foreground"}`}
                        >
                          {item.name}
                          {selected ? " ×" : ""}
                        </button>
                      );
                    })}
                    {!eventFunctions.length && (
                      <span className="text-xs text-muted-foreground">
                        No functions available
                      </span>
                    )}
                  </div>
                </Field>
                <Field
                  name="quantity"
                  label="Required Quantity"
                  required
                  error={errors.quantity}
                >
                  <Input
                    {...inputProps("quantity")}
                    type="number"
                    min="1"
                    step="1"
                    value={form.quantity}
                    onChange={(event) => update("quantity", event.target.value)}
                    className="h-10 text-xs"
                  />
                </Field>
                <Field name="unit" label="Unit" required>
                  <Select
                    value={form.unit}
                    onValueChange={(value) => update("unit", value)}
                  >
                    <SelectTrigger
                      {...inputProps("unit")}
                      className="h-10 text-xs"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((value) => (
                        <SelectItem key={value} value={value}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <Field
                name="likes"
                label="Specification / Details (Optional)"
                className="mt-4"
              >
                <Textarea
                  {...inputProps("likes")}
                  value={form.likes}
                  maxLength={500}
                  placeholder="e.g. 6 ft floral stand, gold finish, fabric type, color, etc."
                  onChange={(event) => update("likes", event.target.value)}
                  className="min-h-20 text-xs"
                />
                <p className="text-right text-[10px] text-muted-foreground">
                  {form.likes.length}/500
                </p>
              </Field>
            </Section>

            <Section
              number="3"
              title="Delivery & Coordination"
              description="Add delivery, pickup details and assign a team member."
            >
              <div className="grid gap-4 lg:grid-cols-5">
                <Field
                  name="deliveryAt"
                  label="Delivery Date"
                  required
                  error={errors.deliveryAt}
                >
                  <Input
                    {...inputProps("deliveryAt")}
                    type="date"
                    value={datePart(form.deliveryAt, "date")}
                    onChange={(event) =>
                      updateDateTime("deliveryAt", "date", event.target.value)
                    }
                    className="h-10 text-xs"
                  />
                </Field>
                <Field name="deliveryTime" label="Delivery Time" required>
                  <div className="relative">
                    <Clock className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      {...inputProps("deliveryTime")}
                      type="time"
                      value={datePart(form.deliveryAt, "time")}
                      onChange={(event) =>
                        updateDateTime("deliveryAt", "time", event.target.value)
                      }
                      className="h-10 pl-9 text-xs"
                    />
                  </div>
                </Field>
                <div className="space-y-1.5">
                  <Label>Return / Pickup Required?</Label>
                  <button
                    type="button"
                    onClick={() => setReturnRequired((value) => !value)}
                    className={`flex h-10 items-center gap-2 text-sm ${returnRequired ? "text-emerald-700" : "text-muted-foreground"}`}
                  >
                    <span
                      className={`relative h-6 w-11 rounded-full ${returnRequired ? "bg-emerald-600" : "bg-muted"}`}
                    >
                      <span
                        className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${returnRequired ? "left-6" : "left-1"}`}
                      />
                    </span>
                    {returnRequired ? "Yes" : "No"}
                  </button>
                </div>
                {returnRequired && (
                  <>
                    <Field
                      name="returnAt"
                      label="Return / Pickup Date"
                      required
                      error={errors.returnAt}
                    >
                      <Input
                        {...inputProps("returnAt")}
                        type="date"
                        value={datePart(form.returnAt, "date")}
                        onChange={(event) =>
                          updateDateTime("returnAt", "date", event.target.value)
                        }
                        className="h-10 text-xs"
                      />
                    </Field>
                    <Field
                      name="returnTime"
                      label="Return / Pickup Time"
                      required
                    >
                      <div className="relative">
                        <Clock className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          {...inputProps("returnTime")}
                          type="time"
                          value={datePart(form.returnAt, "time")}
                          onChange={(event) =>
                            updateDateTime(
                              "returnAt",
                              "time",
                              event.target.value,
                            )
                          }
                          className="h-10 pl-9 text-xs"
                        />
                      </div>
                    </Field>
                  </>
                )}
                <Field name="coordinator" label="Coordinator (Optional)">
                  <Select
                    value={form.coordinator || "none"}
                    onValueChange={(value) =>
                      update("coordinator", value === "none" ? "" : value)
                    }
                  >
                    <SelectTrigger
                      {...inputProps("coordinator")}
                      className="h-10 text-xs"
                    >
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Unassigned</SelectItem>
                      {coordinators.map((item) => (
                        <SelectItem key={idOf(item)} value={idOf(item)}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </Section>
            {errors.form && (
              <p role="alert" className="text-sm text-destructive">
                {errors.form}
              </p>
            )}
          </fieldset>
        </form>
        <DialogFooter className="shrink-0 flex-row items-center justify-between border-t bg-background px-5 py-4">
          <Button
            type="button"
            variant="outline"
            disabled={isSaving}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="vendor-requirement-form"
            className="bg-slate-950 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-950"
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            {mode === "edit"
              ? "Save Vendor Requirement"
              : "Add Vendor Requirement"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
