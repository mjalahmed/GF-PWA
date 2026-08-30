export type UserAuthRecord = {
  id: string;
  email: string | null;
};

export interface UserRepository {
  findAuthEmail(userId: string): Promise<UserAuthRecord>;
  ensureExists(userId: string): Promise<void>;
}
