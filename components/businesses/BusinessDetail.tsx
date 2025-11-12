import Badge from "@/components/common/Badge";
import Button from "@/components/common/Button";
import CopyableText from "@/components/common/CopyableText";
import { Business } from "@/data/businesses";

type BusinessDetailProps = {
  business: Business;
};

const BusinessDetail = ({ business }: BusinessDetailProps) => (
  <div className="grid gap-6 lg:grid-cols-3">
    <section className="space-y-4 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm lg:col-span-2">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-neutral-900">
          {business.companyName}
        </h2>
        <div className="flex flex-wrap gap-2">
          {business.sponsorshipTags.map((tag) => (
            <Badge key={tag} variant="info">
              {tag}
            </Badge>
          ))}
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Contact Details
          </h3>
          <dl className="space-y-2 text-sm text-neutral-700">
            <div>
              <dt className="font-medium text-neutral-900">Primary Contact</dt>
              <dd>{business.contactName}</dd>
            </div>
            <div>
              <dt className="font-medium text-neutral-900">Email</dt>
              <dd>
                <CopyableText
                  text={business.email}
                  successMessage="Email copied to clipboard!"
                  className="cursor-pointer text-primary-600 hover:underline"
                />
              </dd>
            </div>
            <div>
              <dt className="font-medium text-neutral-900">Phone</dt>
              <dd>
                <CopyableText
                  text={business.phone}
                  successMessage="Phone number copied to clipboard!"
                  className="cursor-pointer text-neutral-700 hover:text-neutral-900"
                />
              </dd>
            </div>
          </dl>
        </div>
        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Address
          </h3>
          <p className="text-sm text-neutral-700">{business.address}</p>
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Linked Events
        </h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {business.linkedEvents.length > 0 ? (
            business.linkedEvents.map((event) => (
              <span
                key={event}
                className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600"
              >
                {event}
              </span>
            ))
          ) : (
            <span className="text-sm text-neutral-500">
              No linked events yet.
            </span>
          )}
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Notes
        </h3>
        <p className="mt-3 rounded-md bg-neutral-50 p-4 text-sm text-neutral-700">
          {business.notes || "No notes added yet."}
        </p>
      </div>
    </section>
    <aside className="space-y-4 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
        Quick Actions
      </h3>
      <div className="flex flex-col gap-2">
        <Button
          variant="primary"
          size="md"
          onClick={() => {
            // TODO: Implement future sponsor renewal flow.
          }}
        >
          Renew Sponsorship
        </Button>
        <Button
          variant="secondary"
          size="md"
          onClick={() => {
            // TODO: Trigger email or CRM integration for outreach.
          }}
        >
          Send Update
        </Button>
        <Button
          variant="ghost"
          size="md"
          onClick={() => {
            // TODO: Link to historical sponsorship report view.
          }}
        >
          View History
        </Button>
      </div>
    </aside>
  </div>
);

export default BusinessDetail;

