export interface CsvRow3 {
  Ref_Ticket:      string | number;
  Duration_second: string | number;
  Time_Cost:       string | number;
  Fixed_Cost:      string | number;
}

export interface CachedTicketCost {
  id:       number;
  ticketId: number;
  ref:      string;
}

export interface GlpiTicketCostPayload {
  tickets_id: number;
  duration:   number;
  cost_time:  number;
  cost_fixed: number;
}