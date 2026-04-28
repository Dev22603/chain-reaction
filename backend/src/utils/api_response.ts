export interface ApiResponse<T> {
  success: true;
  data: T;
}

export function apiResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data
  };
}
