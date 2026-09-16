import { FilterListSkeleton } from "@/components/custom/skeletons/search";
import { useCollections } from "@/hooks/use-catalog-products";
import FilterList from "./filter";

interface SubCollectionsProps {
  parentId: string;
}

export default function SubCollections({ parentId }: SubCollectionsProps) {
  const collectionsQuery = useCollections({ parentId });

  if (collectionsQuery.isLoading) {
    return <FilterListSkeleton />;
  }

  return <FilterList list={collectionsQuery.data ?? []} title="Collections" />;
}
