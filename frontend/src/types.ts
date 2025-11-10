export interface User {
  id: string;
  email: string;
  token: string;
}

// Frontend local representation aligned with backend Generation model
export interface Generation {
  id: number;
  imageUrl: string | null;
  prompt: string;
  style: string | null;
  createdAt: string;
  status: "PENDING" | "COMPLETED" | "FAILED";
}
