export const planningId = value => String(value?._id || value || "");
export const planningPayload = value => value?.requiredFrom || value?.releaseBy || value?.designatedSourceAllocation ? {
  requiredFrom: value.requiredFrom || "", releaseBy: value.releaseBy || "",
  designatedSourceAllocation: value.designatedSourceAllocation || null,
} : undefined;
export const linePlanningPayload = value => value ? {
  fulfilmentPlan: value.fulfilmentPlan,
  mainStoreQuantity: Number(value.mainStoreQuantity), eventQuantity: Number(value.eventQuantity),
  sourceAllocationLine: value.sourceAllocationLine || null,
} : undefined;

