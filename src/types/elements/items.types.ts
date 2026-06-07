export type GLPIItem = {
  id: number;
  name: string | null;
  serial?: string | null;
  otherserial?: string | null;
  type?: string | null;
};

export interface GlpiAsset {
  id: number;

  name: string | null;
  comment?: string | null;

  serial?: string | null;
  otherserial?: string | null;

  is_deleted: boolean;
  is_template?: boolean;
  is_dynamic?: boolean;
  is_recursive?: boolean;

  date_creation?: string | null;
  date_mod?: string | null;

  status?: string | null;

  entity?: {
    id: number;
    name: string;
    completename: string;
  } | null;

  manufacturer?: {
    id: number;
    name: string;
  } | null;

  model?: {
    id: number;
    name: string;
  } | null;

  location?: {
    id: number;
    name: string;
  } | null;

  user?: {
    id: number;
    name: string;
  } | null;

  user_tech?: {
    id: number;
    name: string;
  } | null;

  type?: {
    id: number;
    name: string;
  } | null;

  network?: {
    id: number;
    name: string;
  } | null;

  itemType: string;
}