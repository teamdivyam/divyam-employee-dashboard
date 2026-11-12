const idOf = (value) => String(value?._id || value || '');
export const documentsForEvent = (documents, eventId) => {
  const id = idOf(eventId);
  return id ? (documents || []).filter((document) => !document.removedAt && idOf(document.booking) === id) : [];
};
export const latestDocumentForEvent = (documents, eventId) => documentsForEvent(documents, eventId)
  .reduce((latest, document) => {
    if (!latest) return document;
    const latestTime = Date.parse(latest.uploadedAt) || Date.parse(latest.createdAt) || 0;
    const documentTime = Date.parse(document.uploadedAt) || Date.parse(document.createdAt) || 0;
    return documentTime >= latestTime ? document : latest;
  }, null);
