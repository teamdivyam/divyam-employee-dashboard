import { employeeV2Request } from './employee-v2.service';

async function request(method, path, data, options = {}) {
  const response = await employeeV2Request({ method, url: '/central-command' + path, data, ...options });
  return response.data.data;
}
export default {
  list: (path, params, signal) => request('get', path, undefined, { params, signal }),
  get: path => request('get', path),
  create: (path, data) => request('post', path, data),
  update: (path, data) => request('patch', path, data),
  upload: (eventId, file, onUploadProgress, signal) => {
    const form = new FormData();
    form.append('file', file);
    form.append('eventId', eventId);
    return request('post', '/files', form, { timeout: 120000, headers: { 'Content-Type': undefined }, onUploadProgress, signal });
  },
  media: async (conversationId, messageId, index) => {
    const response = await employeeV2Request.get(`/central-command/conversations/${conversationId}/messages/${messageId}/media/${index}`, { responseType: 'blob' });
    return response.data;
  },
};
