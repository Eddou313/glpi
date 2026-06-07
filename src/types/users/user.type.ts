export interface GLPIUser {
  id: number;
  username: string;
  realname: string | null;
  firstname: string | null;
  phone: string | null;
  mobile: string | null;
  is_active: boolean;
  is_deleted: boolean;
  last_login: string | null;
  default_entity: { id: number; name: string } | null;
}