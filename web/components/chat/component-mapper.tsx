"use client";

import {
  AppointmentList,
  PropertyCard,
  ServiceCard,
  PropertyList,
  BankCard,
  BankList,
  PurposiveSummary,
  ExtraContentCard,
  ImagePreview,
  DocumentCard,
  type Property,
  type Bank,
  type Service,
  type Document,
  type PurposiveSummaryData,
  type ExtraContentItem,
  type Offer,
  type LoanCalculationData,
  OfferCard,
  OfferList,
  LoanCalculatorCard,
} from "./chat-data-views";
import { TableView, type TableData } from "./table-view";
import { MarkdownContent } from "./markdown-content";

export type ComponentType =
  | "text"
  | "appointment"
  | "appointment-list"
  | "property"
  | "property-list"
  | "bank"
  | "bank-list"
  | "service"
  | "service-list"
  | "image"
  | "document"
  | "coupon"
  | "table"
  | "streaming"
  | "purposive"
  | "extra"
  | "offer"
  | "offer-list"
  | "loan-calculation";

export interface ComponentData {
  type: ComponentType;
  data: unknown;
}

export function ComponentMapper({ type, data }: ComponentData) {
  switch (type) {
    case "appointment":
      return (
        <AppointmentList appointments={Array.isArray(data) ? data : [data]} />
      );

    case "appointment-list":
      return <AppointmentList appointments={Array.isArray(data) ? data : []} />;

    case "property":
      return <PropertyCard property={data as Property} />;

    case "property-list":
      return <PropertyList properties={Array.isArray(data) ? data : [data]} />;

    case "bank":
      return <BankCard bank={data as Bank} />;

    case "bank-list":
      return <BankList banks={Array.isArray(data) ? data : [data]} />;

    case "service":
      return <ServiceCard service={data as Service} />;

    case "service-list":
      return (
        <div className="flex flex-col gap-3 w-full mt-3 mb-3">
          {Array.isArray(data)
            ? data.map((service, i) => (
                <ServiceCard
                  key={(service as Service).id || i}
                  service={service as Service}
                />
              ))
            : null}
        </div>
      );

    case "image": {
      const imgData = data as { src?: string } | string;
      const src = typeof imgData === "string" ? imgData : (imgData.src ?? "");
      return <ImagePreview src={src} />;
    }

    case "document":
      return <DocumentCard doc={data as Document} />;

    case "table":
      return (
        <div className="w-full">
          <TableView data={data as TableData} />
        </div>
      );

    case "streaming": {
      const streamingData = data as
        | {
            text?: string;
            speed?: number;
            toolEvents?: Array<{ name: string; label: string; state: "running" | "done" }>;
          }
        | string;
      const text =
        typeof streamingData === "string"
          ? streamingData
          : (streamingData.text ?? "");
      const speed =
        typeof streamingData === "object" ? streamingData.speed : undefined;
      const toolEvents =
        typeof streamingData === "object" && Array.isArray(streamingData.toolEvents)
          ? streamingData.toolEvents
          : [];
      return (
        <div className="w-full">
          <MarkdownContent content={text} />
          {toolEvents.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {toolEvents.map((event, idx) => (
                <span
                  key={`${event.name}-${idx}`}
                  className="rounded-full border border-border/50 bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground"
                >
                  {event.state === "done" ? "✓ " : "… "}
                  {event.label}
                </span>
              ))}
            </div>
          ) : null}
          {speed ? (
            <p className="mt-2 text-xs text-muted-foreground">
              سرعة العرض: {speed}
            </p>
          ) : null}
        </div>
      );
    }

    case "purposive":
      return <PurposiveSummary data={data as PurposiveSummaryData} />;

    case "extra": {
      const extraData = data as
        | { items?: ExtraContentItem[] }
        | ExtraContentItem[];
      const items = Array.isArray(extraData)
        ? extraData
        : (extraData.items ?? []);
      return <ExtraContentCard items={items} />;
    }

    case "offer":
      return <OfferCard offer={data as Offer} />;

    case "offer-list":
      return <OfferList offers={Array.isArray(data) ? data : []} />;

    case "loan-calculation":
      return <LoanCalculatorCard data={data as LoanCalculationData} />;

    case "coupon":
      return null;

    default:
      return null;
  }
}
