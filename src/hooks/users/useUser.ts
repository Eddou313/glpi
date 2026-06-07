import { glpiGet } from "../../api/db_glpi";
import type { GLPIUser } from "../../types/users/user.type";

const getUser = await glpiGet<GLPIUser[]>('Administration/User');

export function useUser() {
    async function fetchUser():Promise<GLPIUser[]> {
        try {
            const users = getUser;
            return users;
        } catch (error) {
            console.error("Erreur lors de la récupération des utilisateurs GLPI:", error);
            throw error;
        }
    }
    return {
        fetchUser,
    };
}