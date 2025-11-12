import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";

type CopyableTextProps = {
  text: string;
  successMessage?: string;
  className?: string;
  children?: React.ReactNode;
};

const CopyableText = ({
  text,
  successMessage,
  className = "cursor-pointer hover:underline",
  children
}: CopyableTextProps) => {
  const { copyToClipboard } = useCopyToClipboard();

  const handleClick = () => {
    copyToClipboard(text, successMessage);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={className}
    >
      {children || text}
    </button>
  );
};

export default CopyableText;

