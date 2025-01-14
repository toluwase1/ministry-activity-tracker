import { toast } from 'sonner';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  validationErrors: string[] | null;
  result?: T;
}

export const handleApiResponse = (response: ApiResponse) => {
  if (response.success) {
    toast.success(response.message || 'Operation completed successfully');
    return true;
  } else {
    // Show each validation error as a separate error toast
    if (response.validationErrors && response.validationErrors.length > 0) {
      response.validationErrors.forEach(error => {
        toast.error(error);
      });
    } else {
      // If no validation errors, show the general error message
      toast.error(response.message || 'Operation failed');
    }
    return false;
  }
};
