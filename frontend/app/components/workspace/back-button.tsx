import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router";

export const BackButton = () => {
  const navigate = useNavigate();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => navigate(-1)}
      className="p-4 mr-4"
    >
      <ArrowLeft className="mr-2 size-4" />
      Back
    </Button>
  );
};
