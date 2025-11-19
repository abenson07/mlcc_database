import { GetServerSideProps } from "next";
import Link from "next/link";
import AdminLayout from "@/components/layout/AdminLayout";
import Button from "@/components/common/Button";
import BusinessDetail from "@/components/businesses/BusinessDetail";
import { Business } from "@/data/businesses";
import { serverSupabase } from "@/lib/serverSupabase";

type BusinessDetailPageProps = {
  business: Business;
};

const BusinessDetailPage = ({ business }: BusinessDetailPageProps) => (
  <AdminLayout
    header={
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Link
            href="/businesses"
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            ← Back to businesses
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-neutral-900">
            {business.companyName}
          </h1>
          <p className="text-sm text-neutral-500">
            Detailed profile and sponsorship activity
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="md"
            onClick={() => {
              // TODO: Attach export to PDF functionality.
              console.info("export business profile", business.id);
            }}
          >
            Export Profile
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              // TODO: Hook into sponsor renewal workflow.
              console.info("renew sponsorship", business.id);
            }}
          >
            Renew Sponsorship
          </Button>
        </div>
      </div>
    }
  >
    <BusinessDetail business={business} />
  </AdminLayout>
);

export const getServerSideProps: GetServerSideProps<
  BusinessDetailPageProps,
  { id: string }
> = async ({ params }) => {
  const businessId = params?.id;

  if (!businessId) {
    return { notFound: true };
  }

  try {
    const { data, error } = await serverSupabase
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .single();

    if (error || !data) {
      return { notFound: true };
    }

    // Map Supabase data to Business type
    const validStatuses: Business['status'][] = ['activeMember', 'pastSponsor', 'yetToSupport'];
    const validSponsorshipLevels: Business['sponsorshipTags'][number][] = ['Gold', 'Silver', 'Bronze', 'In-Kind'];
    
    const getStatus = (value: any): Business['status'] => {
      const status = (value || 'yetToSupport').toString();
      return validStatuses.includes(status as Business['status']) 
        ? (status as Business['status']) 
        : 'yetToSupport';
    };

    const getSponsorshipTags = (value: any): Business['sponsorshipTags'] => {
      if (Array.isArray(value)) {
        return value.filter((tag: string) => 
          validSponsorshipLevels.includes(tag as Business['sponsorshipTags'][number])
        ) as Business['sponsorshipTags'];
      }
      if (typeof value === 'string') {
        return value.split(',')
          .map((s: string) => s.trim())
          .filter((tag: string) => validSponsorshipLevels.includes(tag as Business['sponsorshipTags'][number])) as Business['sponsorshipTags'];
      }
      return [];
    };

    const getLinkedEvents = (value: any): string[] => {
      if (Array.isArray(value)) {
        return value;
      }
      if (typeof value === 'string') {
        return value.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
      return [];
    };

    const business: Business = {
      id: data.id?.toString() || '',
      companyName: data.name || data.company_name || data.companyName || '',
      contactName: data.contact_name || data.contactName || '',
      email: data.email || '',
      phone: data.phone || '',
      sponsorshipTags: getSponsorshipTags(data.sponsorship_tags || data.sponsorshipTags),
      linkedEvents: getLinkedEvents(data.linked_events || data.linkedEvents),
      address: data.address || '',
      notes: data.notes || '',
      status: getStatus(data.status),
    };

    return {
      props: {
        business
      }
    };
  } catch (error) {
    console.error('Error fetching business:', error);
    return { notFound: true };
  }
};

export default BusinessDetailPage;

