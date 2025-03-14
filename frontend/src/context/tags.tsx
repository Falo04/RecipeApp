import { Api } from "@/api/api";
import type { Page } from "@/api/model/global.interface";
import type { SimpleTag } from "@/api/model/tag.interface"
import React, { useEffect } from "react";
import { toast } from "sonner";

export type TagsContext = {
  tags: Page<SimpleTag>;

  reset: () => void;
}

const TAGS_CONTEXT = React.createContext<TagsContext>({
  tags: {
    items: [],
    limit: 50,
    offset: 0,
    total: 0,
  },
  reset: () => { },
})
TAGS_CONTEXT.displayName = "TagsContext";
export default TAGS_CONTEXT;

type TagsProviderProps = {
  children: React.ReactNode | Array<React.ReactNode>;
}


export function TagsProvider(props: TagsProviderProps) {
  const [tags, setTags] = React.useState<Page<SimpleTag> | "loading">("loading");
  let fetching = false;

  const fetchTags = async () => {
    if (fetching) return;
    fetching = true;

    const res = await Api.tags.getAll();
    if (res.error) {
      toast.error(res.error.message);
      return;
    }

    if (res.data) {
      setTags(res.data);
    }

    fetching = false;
  }

  useEffect(() => {
    fetchTags().then();
  }, []);

  if (tags === "loading") {
    return <div>Loading...</div>
  }

  return (
    <TAGS_CONTEXT.Provider value={{
      tags: tags,
      reset: fetchTags,
    }}>
      {props.children}
    </TAGS_CONTEXT.Provider>
  )
}
