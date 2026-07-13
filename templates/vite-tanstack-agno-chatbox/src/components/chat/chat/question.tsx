"use client";

import { Markdown } from "../markdown/markdown";
import type { ChatListItem } from "./hooks";
import { OperationTools } from "./operation-tools";

interface QuestionProps {
  item: ChatListItem;
}

export const Question = ({ item }: QuestionProps) => {
  return (
    <div className="mt-8 flex w-full flex-col items-end">
      <div className="w-fit max-w-[90%] space-x-2 overflow-x-hidden rounded-md bg-gray-200 px-3 py-1.5">
        <Markdown content={item.content} />
      </div>
      <OperationTools item={item} className="mt-1" />
    </div>
  );
};
