// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

export const API_ENDPOINTS = {
  // Services
  SERVICES: `${API_BASE_URL}/api/services`,
  SERVICE_DETAILS: (id) => `${API_BASE_URL}/api/services/${id}`,
  
  // Customers
  CUSTOMERS: `${API_BASE_URL}/api/customers`,
  CUSTOMER_PROFILE: (id) => `${API_BASE_URL}/api/customers/profile/${id}`,
  CUSTOMER_BOOKINGS: (id) => `${API_BASE_URL}/api/customers/detailed-bookings/${id}`,
  CUSTOMER_BOOK_SERVICE: (customerId, serviceId) => `${API_BASE_URL}/api/customers/book-service/${customerId}/${serviceId}`,
  CUSTOMER_BULK_BOOK: (customerId) => `${API_BASE_URL}/api/customers/bulk-book-services/${customerId}`,
  CUSTOMER_CANCEL_BOOKING: (serviceId, bookingId) => `${API_BASE_URL}/api/customers/cancel-booking/${serviceId}/${bookingId}`,
  CUSTOMER_REVIEW: (customerId, serviceId) => `${API_BASE_URL}/api/customers/review/${customerId}/${serviceId}`,
  CUSTOMER_CHECK_USERNAME: (username) => `${API_BASE_URL}/api/customers/check-username/${username}`,
  
  // Vendors
  VENDORS: `${API_BASE_URL}/api/vendors`,
  VENDOR_SERVICES: (vendorId) => `${API_BASE_URL}/api/vendors/services/${vendorId}`,
  VENDOR_BOOKINGS: (vendorId) => `${API_BASE_URL}/api/vendors/bookings/${vendorId}`,
  VENDOR_PROFILE: (vendorId) => `${API_BASE_URL}/api/vendors/profile/${vendorId}`,
  VENDOR_SERVICE: (vendorId, serviceId) => `${API_BASE_URL}/api/vendors/services/${vendorId}/${serviceId}`,
  VENDOR_DELETE_SERVICE: (vendorId, serviceId) => `${API_BASE_URL}/api/vendors/services/${vendorId}/${serviceId}`,
  VENDOR_ACCEPT_BOOKING: (vendorId, serviceId, bookingId) => `${API_BASE_URL}/api/vendors/accept-booking/${vendorId}/${serviceId}/${bookingId}`,
  VENDOR_REJECT_BOOKING: (vendorId, serviceId, bookingId) => `${API_BASE_URL}/api/vendors/reject-booking/${vendorId}/${serviceId}/${bookingId}`,
  VENDOR_CHECK_USERNAME: (username) => `${API_BASE_URL}/api/vendors/check-username/${username}`,
  
  // Admin
  ADMIN_LOGIN: `${API_BASE_URL}/api/admin/login`,
  ADMIN_VENDORS: `${API_BASE_URL}/api/admin/vendors`,
  ADMIN_PENDING_VENDORS: `${API_BASE_URL}/api/admin/vendors/pending`,
  ADMIN_CUSTOMERS: `${API_BASE_URL}/api/admin/customers`,
  ADMIN_SERVICES: `${API_BASE_URL}/api/admin/services`,
  ADMIN_BOOKINGS: `${API_BASE_URL}/api/admin/bookings`,
  ADMIN_VENDOR_APPROVE: (vendorId) => `${API_BASE_URL}/api/admin/vendors/${vendorId}/approve`,
  ADMIN_VENDOR_REJECT: (vendorId) => `${API_BASE_URL}/api/admin/vendors/${vendorId}/reject`,
  ADMIN_ENTITY_DETAILS: (entityType, entityId) => `${API_BASE_URL}/api/admin/${entityType}/${entityId}`,
  
  // Chats
  CHAT_START: `${API_BASE_URL}/api/chats/start`,
  CHAT_SEND: (chatId) => `${API_BASE_URL}/api/chats/${chatId}/send`,
  CHAT_LIST_FOR_CUSTOMER: (customerId) => `${API_BASE_URL}/api/chats/customer/${customerId}`,
  CHAT_LIST_FOR_VENDOR: (vendorId) => `${API_BASE_URL}/api/chats/vendor/${vendorId}`,
  CHAT_LIST_FOR_ADMIN: `${API_BASE_URL}/api/chats/admin/all`,
  CHAT_ADMIN_START: `${API_BASE_URL}/api/chats/admin/start`,
  CHAT_ADMIN_JOIN: (chatId) => `${API_BASE_URL}/api/chats/admin/${chatId}/join`,
  CHAT_ADMIN_AUTO_MESSAGE: (chatId) => `${API_BASE_URL}/api/chats/admin/${chatId}/auto-message`,
  
  // Service Management
  BULK_BLOCK_SERVICES: `${API_BASE_URL}/api/services/bulk-block`,
  BULK_UNBLOCK_SERVICES: `${API_BASE_URL}/api/services/bulk-unblock`,
};

export default API_BASE_URL; 