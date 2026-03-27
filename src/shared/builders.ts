import type {PagedResponse} from "../types/requests.js";

export const createPagedResponse = <T>({
 content,
 totalItems,
 sort
}: {
  content: T[];
  totalItems: number;
  sort?: { property?: string; direction?: string }[];
}): PagedResponse<T> => {
  return {
    content,
    totalItems,
    itemCount: content.length,
    sort: sort ?? []
  };
};