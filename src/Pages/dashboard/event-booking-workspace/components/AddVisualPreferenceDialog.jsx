/* eslint-disable react/prop-types */
import { useMemo } from 'react';

import EventVisualPreferenceDialog from './EventVisualPreferenceDialog';

export default function AddVisualPreferenceDialog({ customer = {}, onSubmit, ...props }) {
  const functions = useMemo(
    () => (customer.functionDetails?.length
      ? customer.functionDetails
      : (customer.ceremonies || []).map((name) => ({ name })))
      .map((fn) => ({ ...fn, _id: fn._id || fn.name })),
    [customer.functionDetails, customer.ceremonies],
  );
  const mappedCustomer = useMemo(
    () => ({ ...customer, functionDetails: functions }),
    [customer, functions],
  );

  const submit = (payload) => {
    const values = payload instanceof FormData ? Object.fromEntries(payload.entries()) : payload;
    const names = {
      preferenceTitle: 'title',
      functionAppliesTo: 'functionName',
      preferenceCategory: 'category',
      clientLikes: 'likes',
    };
    const data = new FormData();

    Object.entries(values).forEach(([key, originalValue]) => {
      let value = originalValue;
      if (key === 'functionAppliesTo') {
        value = functions.find((fn) => String(fn._id) === String(value))?.name;
      }
      if (key === 'image' && typeof value === 'string') return;
      if (value !== undefined) data.append(names[key] || key, value);
    });
    data.set('recordStatus', 'Saved');
    onSubmit(data);
  };

  return (
    <EventVisualPreferenceDialog
      {...props}
      customer={mappedCustomer}
      onSubmit={submit}
    />
  );
}
