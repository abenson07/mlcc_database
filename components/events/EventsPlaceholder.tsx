import Button from "@/components/common/Button";
import { events } from "@/data/events";

const EventsPlaceholder = () => (
  <div className="rounded-lg border border-dashed border-primary-300 bg-cream-100 p-10 text-center">
    <h2 className="text-lg font-semibold text-primary-800">
      Events coming soon
    </h2>
    <p className="mt-2 text-sm text-neutral-600">
      This view will surface campaign planning tools, volunteer assignments, and
      RSVP tracking. For now, review the sample events below.
    </p>
    <div className="mt-6 space-y-3 text-left">
      {events.map((event) => (
        <div
          key={event.id}
          className="rounded-md border border-primary-200 bg-cream-100 p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-primary-800">
                {event.name}
              </h3>
              <p className="text-xs text-neutral-600">
                {new Date(event.date).toLocaleDateString()} · {event.location}
              </p>
            </div>
            <div className="text-xs text-neutral-600">
              {event.attendees} attendees · {event.volunteersNeeded} volunteers
              needed
            </div>
          </div>
          {event.notes && (
            <p className="mt-2 text-sm text-neutral-700">{event.notes}</p>
          )}
        </div>
      ))}
    </div>
    <div className="mt-6 flex justify-center gap-3">
      <Button
        variant="primary"
        size="md"
        onClick={() => {
          // TODO: Hook up to future event creation workflow.
        }}
      >
        Plan New Event
      </Button>
      <Button
        variant="ghost"
        size="md"
        onClick={() => {
          // TODO: Link to external calendar or event tool integration.
        }}
      >
        Connect Calendar
      </Button>
    </div>
  </div>
);

export default EventsPlaceholder;

