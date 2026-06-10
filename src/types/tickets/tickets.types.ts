export interface GLPITicketListe {
  id: number;
  name: string;
  content: string;
  status: { id: number; name: string } | number;
  urgency: number;
  priority: number;
  date: string;

  requester?: {
    id: number;
    name: string;
  };

  technician?: {
    id: number;
    name: string;
  };
  type : number;
}

export type GLPITicketDetail = {
  id: number;
  name: string;
  content: string;

  date: string;
  date_creation: string;
  date_mod: string;

  is_deleted: boolean;

  urgency: number;
  impact: number;
  priority: number;

  type: number;

  status: {
    id: number;
    name: string;
  };

  entity: {
    id: number;
    name: string;
    completename: string;
  };

  request_type: {
    id: number;
    name: string;
  };

  user_recipient: {
    id: number;
    name: string;
  } | null;

  user_editor: {
    id: number;
    name: string;
  } | null;

  category: {
    id: number;
    name: string;
  } | null;

  location: {
    id: number;
    name: string;
  } | null;

  team: GLPITicketTeamMember[];
};

export type GLPITicketTeamMember = {
  id: number;
  role: string;

  name: string;

  realname: string | null;
  firstname: string | null;

  display_name: string;

  href: string;

  type: string;
};

export type CreateTicketRequest = {
  id?: number;
  name: string;
  content: string;

  urgency: number;
  impact: number;

  category?: {
    id: number;
  };

  location?: {
    id: number;
  };

  request_type?: {
    id: number;
  };

  user_recipient?: {
    id: number;
  };

  user_editor?: {
    id: number;
  };

  type?: number;
  priority?: number;

  items?: {
    id: number;
    itemtype: string;
  }[];
  status?: {
    id: number;
    name: string;
  };
};