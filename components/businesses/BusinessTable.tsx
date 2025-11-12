import { ReactNode } from "react";
import Badge from "@/components/common/Badge";
import Button from "@/components/common/Button";
import CopyableText from "@/components/common/CopyableText";
import Table, { TableColumn } from "@/components/common/Table";
import { Business } from "@/data/businesses";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";

type BusinessTableProps = {
  data: Business[];
  selectedId?: string;
  onRowClick?: (business: Business) => void;
  onView?: (business: Business) => void;
  onEmail?: (business: Business) => void;
  onClose?: () => void;
};

const columns: TableColumn<Business>[] = [
  { key: "companyName", header: "Company" },
  { key: "contactName", header: "Contact" },
  { key: "email", header: "Email" },
  { key: "phone", header: "Phone Number" }
];

const renderers: Partial<Record<keyof Business, (business: Business) => ReactNode>> = {
  sponsorshipTags: (business) => (
    <div className="flex flex-wrap gap-1">
      {business.sponsorshipTags.map((tag) => (
        <Badge key={tag} variant="info">
          {tag}
        </Badge>
      ))}
    </div>
  ),
  linkedEvents: (business) => (
    <div className="flex flex-wrap gap-1">
      {business.linkedEvents.map((event) => (
        <span
          key={event}
          className="rounded-full bg-neutral-100 px-2 py-1 text-xs text-neutral-600"
        >
          {event}
        </span>
      ))}
    </div>
  ),
  email: (business) => (
    <CopyableText
      text={business.email}
      successMessage="Email copied to clipboard!"
      className="cursor-pointer text-primary-600 hover:underline"
    />
  ),
  phone: (business) => (
    <CopyableText
      text={business.phone}
      successMessage="Phone number copied to clipboard!"
      className="cursor-pointer text-neutral-700 hover:text-neutral-900"
    />
  )
};

columns.forEach((column) => {
  const renderer = renderers[column.key as keyof Business];
  if (renderer) {
    column.render = renderer;
  }
});

const BusinessTable = ({
  data,
  selectedId,
  onRowClick,
  onView,
  onEmail,
  onClose
}: BusinessTableProps) => {
  const { copyToClipboard } = useCopyToClipboard();
  
  return (
    <Table
      columns={columns}
      data={data}
      caption="Local business sponsors and partners"
      selectedId={selectedId}
      onRowClick={onRowClick}
      rowAction={(business) => {
        const isSelected = selectedId === business.id;
        return (
          <div className="flex justify-end gap-2">
            {isSelected ? (
              <Button variant="ghost" size="sm" onClick={(e) => {
                e.stopPropagation();
                onClose?.();
              }}>
                Close
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(business.email, "Email copied to clipboard!");
                    onEmail?.(business);
                  }}
                >
                  Email
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onView?.(business);
                  }}
                >
                  View
                </Button>
              </>
            )}
          </div>
        );
      }}
    />
  );
};

export default BusinessTable;

