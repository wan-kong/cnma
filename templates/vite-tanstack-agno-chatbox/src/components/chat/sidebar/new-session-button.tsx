import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export const CreateNewSession = ({
  handleNewConversation,
}: {
  handleNewConversation: () => void;
}) => {
  return (
    <Button className="w-full" onClick={() => handleNewConversation()}>
      <PlusIcon className="size-4" />
      <span>新会话</span>
    </Button>
  );
};
