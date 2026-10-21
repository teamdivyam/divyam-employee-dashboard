import { categoryOptions, isPredefinedCategory } from "./data/requirementCategories.js";

// Assigned-event routes can echo query parameters as strings, while the
// validated inventory routes return numbers. Accept both without relaxing
// the completeness checks or treating missing pagination as zero.
const paginationInteger = value => {
  const number = typeof value === "string" && /^\d+$/.test(value)
    ? Number(value) : value;
  return Number.isSafeInteger(number) && number >= 0 ? number : null;
};

// Fetch every server page, preserving the API's existing item order.
export async function loadActiveRequirementCatalog(fetchItems) {
  const items = [];
  let page = 1;
  let totalPages;
  let first;
  do {
    const response = await fetchItems({ page, limit: 100, status: "active" });
    const rawData = response.data?.data;
    const pagination = {
      ...rawData?.pagination,
      page: paginationInteger(rawData?.pagination?.page),
      totalPages: paginationInteger(rawData?.pagination?.totalPages),
      total: paginationInteger(rawData?.pagination?.total),
    };
    if (!Array.isArray(rawData?.items) || pagination.totalPages === null
      || pagination.total === null || pagination.page !== page) {
      throw new Error("The complete inventory catalog could not be loaded.");
    }
    const data = { ...rawData, pagination };
    first ||= data;
    totalPages = data.pagination.totalPages;
    if (totalPages !== first.pagination.totalPages || data.pagination.total !== first.pagination.total) {
      throw new Error("Inventory changed while loading. Please retry.");
    }
    items.push(...data.items);
    page += 1;
  } while (page <= totalPages);
  if (items.length !== first.pagination.total || new Set(items.map(item => item._id)).size !== items.length) {
    throw new Error("The complete inventory catalog could not be loaded.");
  }
  return { ...first, items };
}

export function requirementCatalogGroups(items, search = "") {
  const query = search.trim().toLowerCase();
  const matches = items.filter(item => (item.name || "").toLowerCase().includes(query));
  return categoryOptions.map(({ value }) => [value, matches.filter(item =>
    value === "Other" ? !isPredefinedCategory(item.category) : item.category === value
  )]);
}
